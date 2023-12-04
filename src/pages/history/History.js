import cx from 'classnames'
import { Fragment, useEffect, useRef, useState } from 'react'
import { createUseStyles } from 'react-jss'
import Checkbox from '../../components/Checkbox'
import Column from '../../components/Column'
import Container from '../../components/Container'
import Row from '../../components/Row'
import { POSITION_TOASTS } from '../../components/Toasts/Toasts'
import { SEVERITY_KEYS } from '../../components/Toasts/components/Toast'
import useAlert from '../../hooks/useAlert'
import { useWindowSize } from '../../hooks/useWindowSize'
import TasksAPI from '../../http/task.http'
import { TASK_MODEL } from '../../models'
import { DeleteIcon, EditIcon } from '../../theme/icons'
import { ROUTE_HOME } from '../../utilities/constants'
import {
    dateFormated,
    dateRenderer,
    debounce,
    effortRenderer,
    formatDate,
    getDateAndIndex,
    groupByDate,
    handleApiError,
    objToFlatArray,
} from '../../utilities/helpers'
import EditTaskModal from '../home/EditTaskModal'
import FilterBar from '../home/filter-bar/FilterBar'
import HomeTableHeader from '../home/home-table-heading'

const useStyles = createUseStyles(theme => ({
    taskBodyRoot: {
        paddingTop: 0,
        height: `calc(${window.innerHeight}px - 184px - 58px)`,
        overflow: 'auto',
        paddingBottom: 40,
        [theme.mediaQueries.lUp]: {
            paddingBottom: 16,
        },
    },
    section: {
        marginBottom: theme.spacing * 3,
    },
    sectionHeading: {
        display: 'block',
        margin: [theme.spacing * 3, 0, theme.spacing],
        fontSize: 14,
        fontWeight: 500,
        color: theme.palette.common.textBlack,
    },

    tastBody: {
        display: 'grid',
        gridTemplateColumns: 'auto 1.1fr 0.3fr 0.27fr 0.1fr 0.1fr',
        alignItems: 'center',
        borderTop: `1px solid ${theme.palette.grey[400]}`,
        [theme.mediaQueries.m]: {
            paddingBottom: theme.spacing * 2,
            borderTop: 'unset',
            gridTemplateColumns: '0.1fr 1fr 0.15fr',
        },
    },
    last: {
        borderBottom: `1px solid ${theme.palette.grey[400]}`,
        [theme.mediaQueries.m]: {
            borderBottom: 'unset',
        },
    },
    doneCheck: {
        margin: 0,
    },
    check: {
        ...theme.utils.flexbox.centered,
    },
    text: {
        fontSize: 16,
        fontWeight: 500,
        color: theme.palette.grey[600],
        padding: '0 20px',

        [theme.mediaQueries.m]: {
            paddingLeft: theme.spacing,
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            alignItems: 'start',
            '& p > span:first-child': {
                fontWeight: 500,
                color: theme.palette.grey[600],
                display: 'flex',
                gap: theme.spacing,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                '-webkit-line-clamp': 2,
                '-webkit-box-orient': 'vertical',
            },
        },
    },
    description: {
        textDecoration: 'line-through',
    },
    date: {
        ...theme.utils.flexbox.centered,
        height: 40,
        fontSize: 12,
        fontWeight: 500,
        color: theme.palette.text.disabled,
        borderLeft: `1px solid ${theme.palette.grey[400]}`,
        [theme.mediaQueries.m]: {
            height: 'auto',
            justifyContent: 'start',
            border: 'unset',
        },
    },
    priority: {
        ...theme.utils.flexbox.centered,
        height: 40,
        fontSize: 16,
        fontWeight: 600,
        color: theme.palette.primary.light,
        borderLeft: `1px solid ${theme.palette.grey[400]}`,
        borderRight: `1px solid ${theme.palette.grey[400]}`,
        [theme.mediaQueries.m]: {
            height: 'auto',
            border: 'unset',
        },
    },
    delete: {
        width: 32,
        height: 32,
        borderRadius: 32,
        margin: [0, 'auto'],
        transition: 'all 400ms ease-in-out',
        cursor: 'pointer',
        ...theme.utils.flexbox.centered,
        '&:hover': {
            background: theme.palette.error.light,
            '& > svg > path': {
                fill: theme.palette.common.white,
            },
        },
    },
    edit: {
        cursor: 'pointer',
        ...theme.utils.flexbox.centered,
        height: 40,
        borderRight: `1px solid ${theme.palette.grey[400]}`,
    },
}))

const Completed = () => {
    const classes = useStyles()

    const listRef = useRef(null)

    const { width } = useWindowSize()
    const isMobile = width < 768

    const { triggerAlert } = useAlert()

    //filters
    const [searchInput, setSearchInput] = useState('')
    const [dateFilter, setDateFilters] = useState('')
    const [priority, setPriority] = useState(false)
    const [page, setPage] = useState(1)

    const [tasks, setTasks] = useState([])
    const [total, setTotal] = useState(0)

    const [isLoading, setIsLoading] = useState(false)
    const [openedTask, setOpenedTask] = useState(null)

    useEffect(() => {
        setPage(1)
    }, [searchInput, priority, dateFilter])

    useEffect(() => {
        fetchTasks().then(({ data }) => {
            setTasks(prevTasks =>
                page > 1
                    ? groupByDate(
                          [...objToFlatArray(prevTasks), ...data].reduce(
                              (acc, item) => {
                                  if (
                                      ![...acc.ids].includes(
                                          item[TASK_MODEL.id]
                                      )
                                  ) {
                                      acc.tasks.push(item)
                                      acc.ids.push(item[TASK_MODEL.id])
                                  }
                                  return acc
                              },
                              {
                                  ids: [],
                                  tasks: [],
                              }
                          ).tasks
                      )
                    : { ...groupByDate(data) }
            )
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, searchInput, priority, dateFilter])

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleScroll = () => {
        if (
            window.innerHeight + document.documentElement.scrollTop !==
                document.documentElement.offsetHeight ||
            isLoading
        ) {
            return
        }

        setPage(prevPage => {
            const isHasNextPage = prevPage < Math.ceil(total / 15)
            if (isHasNextPage) {
                setIsLoading(true)
                return prevPage + 1
            }
            return prevPage
        })
    }

    useEffect(() => {
        listRef.current?.addEventListener('scroll', handleScroll)
        return () =>
            // eslint-disable-next-line react-hooks/exhaustive-deps
            listRef.current?.removeEventListener('scroll', handleScroll)
    }, [handleScroll, total])

    const fetchTasks = async () => {
        try {
            const { data } = await TasksAPI.getTasksCompleted({
                page,
                text: searchInput,
                effort: priority?.value,
                from: dateFilter?.[0] && formatDate(dateFilter?.[0]),
                to: dateFilter?.[1] && formatDate(dateFilter?.[1]),
            })

            setIsLoading(false)
            setTotal(data.total)
            return { data: data.data }
        } catch (error) {
            handleApiError({
                error,
                handleGeneralError: title =>
                    triggerAlert({ severity: 'error', title }),
            })
        }
    }
    const onEditTask = async (oldTask, newTask, isUndo = true) => {
        try {
            const { data } = await TasksAPI.editTask(newTask)
            triggerAlert({
                severity: SEVERITY_KEYS.success,
                title: 'A new task has been update to successfully',
                position: POSITION_TOASTS.rightBottom,
            })
            onUpdateItem(oldTask, data, isUndo)
        } catch (error) {
            handleApiError({
                error,
                handleGeneralError: title =>
                    triggerAlert({ severity: 'error', title }),
            })
        }
    }

    const onUpdateItem = (oldTask, data, isUndo) => {
        const { date, index } = getDateAndIndex(oldTask, tasks)

        setTasks(prevTasks => ({
            ...prevTasks,
            [date]: prevTasks[date]
                .map(task => (oldTask.id === task.id ? data : task))
                .filter(task => task[TASK_MODEL.completed]),
        }))

        isUndo &&
            triggerAlert({
                severity: SEVERITY_KEYS.undo,
                title: 'Was it updated by mistake?',
                position: POSITION_TOASTS.rightBottom,
                delay: 5000,
                action: async () => {
                    const { data } = await TasksAPI.editTask(oldTask)
                    setTasks(prevTasks => {
                        const editedTasks = { ...prevTasks }
                        const isHas =
                            editedTasks[date].findIndex(
                                ({ [TASK_MODEL.id]: id }) =>
                                    id === data[TASK_MODEL.id]
                            ) >= 0

                        if (isHas) {
                            editedTasks[date][index] = data
                        } else {
                            editedTasks[date].splice(index, 0, data)
                        }

                        return editedTasks
                    })
                },
            })
    }

    const onDeleteTask = async (task, isUndo = true) => {
        try {
            await TasksAPI.deleteTask(task[TASK_MODEL.id])
            triggerAlert({
                severity: SEVERITY_KEYS.success,
                title: 'A new task has been delete to successfully',
                position: POSITION_TOASTS.rightBottom,
            })
            onDeleteItem(task, isUndo)
        } catch (error) {
            handleApiError({
                error,
                handleGeneralError: title =>
                    triggerAlert({ severity: 'error', title }),
            })
        }
    }
    const onDeleteItem = (task, isUndo) => {
        const { date, index } = getDateAndIndex(task, tasks)

        setTasks(prevTasks => ({
            ...prevTasks,
            [date]: prevTasks[date].filter(
                ({ [TASK_MODEL.id]: id }) => id !== task[TASK_MODEL.id]
            ),
        }))

        isUndo &&
            triggerAlert({
                severity: SEVERITY_KEYS.undo,
                title: 'Was it delete by mistake?',
                position: POSITION_TOASTS.rightBottom,
                delay: 5000,
                action: async () => {
                    const { data } = await TasksAPI.restoreTask(task)
                    setTasks(prevTasks => {
                        const tasks = [...prevTasks[date]]
                        tasks.splice(index, 0, data)
                        const result = {
                            ...prevTasks,
                            [date]: tasks,
                        }
                        return result
                    })
                },
            })
    }

    return (
        <>
            <FilterBar
                onSearchHandler={debounce(setSearchInput, 500)}
                onDateChangeHandler={setDateFilters}
                dateFilter={dateFilter}
                onPriorityHandler={setPriority}
                filterButton={{ filterButtonTitle: 'To Do', link: ROUTE_HOME }}
            />
            <HomeTableHeader />
            <Container className={classes.taskBodyRoot} innerref={listRef}>
                <Row>
                    <Column start={2} span={10}>
                        {Object.keys(tasks).map(date => {
                            const tasksList = tasks[date]
                            const length = tasksList.length
                            if (!length) return <Fragment key={date}></Fragment>
                            return (
                                <Fragment key={date}>
                                    <div className={classes.section}>
                                        <div className={classes.sectionHeading}>
                                            {dateRenderer(date)}
                                        </div>
                                        <div className={classes.taskList}>
                                            {tasksList.map((task, idx) => (
                                                <div
                                                    key={task.id}
                                                    className={cx(
                                                        classes.tastBody,
                                                        idx === length - 1 &&
                                                            classes.last
                                                    )}
                                                >
                                                    {
                                                        <>
                                                            <span
                                                                className={
                                                                    classes.check
                                                                }
                                                            >
                                                                <Checkbox
                                                                    checked={
                                                                        task?.[
                                                                            TASK_MODEL
                                                                                .completed
                                                                        ]
                                                                    }
                                                                    className={
                                                                        classes.doneCheck
                                                                    }
                                                                    onChange={e => {
                                                                        onEditTask(
                                                                            task,
                                                                            {
                                                                                ...task,
                                                                                [TASK_MODEL.completed]:
                                                                                    !task[
                                                                                        TASK_MODEL
                                                                                            .completed
                                                                                    ],
                                                                            }
                                                                        )
                                                                    }}
                                                                />
                                                            </span>
                                                            {isMobile ? (
                                                                <span
                                                                    className={
                                                                        classes.text
                                                                    }
                                                                    onClick={() => {
                                                                        setOpenedTask(
                                                                            task
                                                                        )
                                                                    }}
                                                                >
                                                                    <p>
                                                                        <span>
                                                                            {task?.[
                                                                                TASK_MODEL
                                                                                    .effort
                                                                            ] && (
                                                                                <span
                                                                                    className={
                                                                                        classes.priority
                                                                                    }
                                                                                >
                                                                                    {effortRenderer(
                                                                                        task[
                                                                                            TASK_MODEL
                                                                                                .effort
                                                                                        ]
                                                                                    )}
                                                                                </span>
                                                                            )}
                                                                            <span
                                                                                className={
                                                                                    classes.description
                                                                                }
                                                                            >
                                                                                {
                                                                                    task?.[
                                                                                        TASK_MODEL
                                                                                            .description
                                                                                    ]
                                                                                }
                                                                            </span>
                                                                        </span>
                                                                        <span
                                                                            className={
                                                                                classes.date
                                                                            }
                                                                        >
                                                                            {dateFormated(
                                                                                task?.[
                                                                                    TASK_MODEL
                                                                                        .date
                                                                                ]
                                                                            )}
                                                                        </span>
                                                                    </p>
                                                                </span>
                                                            ) : (
                                                                <>
                                                                    <span
                                                                        className={
                                                                            classes.text
                                                                        }
                                                                    >
                                                                        <span
                                                                            className={
                                                                                classes.description
                                                                            }
                                                                        >
                                                                            {
                                                                                task?.[
                                                                                    TASK_MODEL
                                                                                        .description
                                                                                ]
                                                                            }
                                                                        </span>
                                                                    </span>
                                                                    <span
                                                                        className={
                                                                            classes.date
                                                                        }
                                                                    >
                                                                        {dateFormated(
                                                                            task?.[
                                                                                TASK_MODEL
                                                                                    .date
                                                                            ]
                                                                        )}
                                                                    </span>
                                                                    <span
                                                                        className={
                                                                            classes.priority
                                                                        }
                                                                    >
                                                                        {effortRenderer(
                                                                            task[
                                                                                TASK_MODEL
                                                                                    .effort
                                                                            ]
                                                                        )}
                                                                    </span>
                                                                </>
                                                            )}
                                                            {!isMobile ? (
                                                                <span
                                                                    className={
                                                                        classes.edit
                                                                    }
                                                                    onClick={() => {
                                                                        setOpenedTask(
                                                                            task
                                                                        )
                                                                    }}
                                                                >
                                                                    <EditIcon />
                                                                </span>
                                                            ) : (
                                                                <></>
                                                            )}
                                                            <span
                                                                className={
                                                                    classes.delete
                                                                }
                                                                onClick={() => {
                                                                    onDeleteTask(
                                                                        task
                                                                    )
                                                                }}
                                                            >
                                                                <DeleteIcon />
                                                            </span>
                                                        </>
                                                    }
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Fragment>
                            )
                        })}
                    </Column>
                </Row>
            </Container>

            {!!openedTask && (
                <EditTaskModal
                    onClose={() => {
                        setOpenedTask(null)
                    }}
                    task={openedTask}
                    onUpdateCb={onEditTask}
                />
            )}
        </>
    )
}

export default Completed
