import { Fragment, useEffect, useState } from 'react'
import { createUseStyles } from 'react-jss'
import Column from '../../components/Column'
import Container from '../../components/Container'
import Row from '../../components/Row'
import useAlert from '../../hooks/useAlert'
import TasksAPI from '../../http/task.http'
import { ROUTE_HOME } from '../../utilities/constants'
import cx from 'classnames'
import {
    dateRenderer,
    groupByDate,
    handleApiError,
    effortRenderer,
    dateFormated,
} from '../../utilities/helpers'
import FilterBar from '../home/filter-bar/FilterBar'
import HomeTableHeader from '../home/home-table-heading'
import { useWindowSize } from '../../hooks/useWindowSize'
import { TASK_MODEL } from '../../models'
import Checkbox from '../../components/Checkbox'
import { DeleteIcon, EditIcon } from '../../theme/icons'

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
            gridTemplateColumns: '0.1fr 1fr 0.15fr ',
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
        textDecoration: 'line-through',
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
    const { width } = useWindowSize()
    const isMobile = width < 768
    const { triggerAlert } = useAlert()
    const [searchInput, setSearchInput] = useState('')
    const [dateFilter, setDateFilters] = useState('')
    const [priority, setPriority] = useState(false)
    const [tasks, setTasks] = useState([])
    const [page, setPage] = useState(1)

    useEffect(() => {
        fetchTasks(page)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page])

    const fetchTasks = async page => {
        try {
            const { data } = await TasksAPI.getTasksCompleted(page)
            console.log('data', data)
            setTasks(groupByDate(data.data))
        } catch (error) {
            handleApiError({
                error,
                handleGeneralError: errorMessage =>
                    triggerAlert({ severity: 'error', title: errorMessage }),
            })
        }
    }

    return (
        <>
            <FilterBar
                onSearchHandler={setSearchInput}
                onDateChangeHandler={setDateFilters}
                dateFilter={dateFilter}
                onPriorityHandler={setPriority}
                filterButton={{ filterButtonTitle: 'To Do', link: ROUTE_HOME }}
            />
            <HomeTableHeader />
            <Container className={classes.taskBodyRoot}>
                <Row>
                    <Column start={2} span={10}>
                        {Object.keys(tasks).map(date => {
                            const tasksList = tasks[date]
                            console.log('date', date)
                            console.log('tasksList', tasksList)
                            const length = tasksList.length
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
                                                    <span
                                                        className={
                                                            classes.check
                                                        }
                                                    >
                                                        <Checkbox
                                                            className={
                                                                classes.doneCheck
                                                            }
                                                            checked={
                                                                task?.[
                                                                    TASK_MODEL
                                                                        .completed
                                                                ]
                                                            }
                                                            onChange={
                                                                () => {}
                                                                // onUpdateCb(
                                                                //     { ...task },
                                                                //     {
                                                                //         ...task,
                                                                //         [TASK_MODEL.completed]:
                                                                //             !task[
                                                                //                 TASK_MODEL
                                                                //                     .completed
                                                                //             ],
                                                                //     }
                                                                // )
                                                            }
                                                        />
                                                    </span>
                                                    <span
                                                        className={classes.text}
                                                    >
                                                        {
                                                            task?.[
                                                                TASK_MODEL
                                                                    .description
                                                            ]
                                                        }{' '}
                                                    </span>
                                                    <span
                                                        className={classes.date}
                                                    >
                                                        {dateFormated(
                                                            task[
                                                                TASK_MODEL.date
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
                                                    <span
                                                        className={classes.edit}
                                                        onClick={() => {}}
                                                    >
                                                        <EditIcon />
                                                    </span>
                                                    <span
                                                        className={
                                                            classes.delete
                                                        }
                                                        onClick={() => {}}
                                                    >
                                                        <DeleteIcon />
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Fragment>
                            )
                        })}
                        {/* {[...tasks].map((task, index) => (
                            <></>
                            // <Task
                            //     task={task}
                            //     index={index}
                            //     // isLast={tasks[date]?.length - 1 === index}
                            //     // ref={provided.innerRef}
                            //     // onDeleteCb={onDeleteTask}
                            //     // onUpdateCb={onEditTask}
                            //     // onEditCb={() => {
                            //     //     setOpenedTask(task)
                            //     //     setShowEditModal(true)
                            //     // }}
                            //     // draggableProps={provided.draggableProps}
                            //     // dragHandleProps={provided.dragHandleProps}
                            // />
                        ))} */}
                    </Column>
                </Row>
            </Container>
        </>
    )
}

export default Completed
