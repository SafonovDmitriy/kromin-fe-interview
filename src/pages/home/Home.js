import { useEffect, useMemo, useState } from 'react'
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd'
import { createUseStyles } from 'react-jss'
import Column from '../../components/Column'
import Container from '../../components/Container'
import Row from '../../components/Row'
import Task from '../../components/Task'
import { POSITION_TOASTS } from '../../components/Toasts/Toasts'
import { SEVERITY_KEYS } from '../../components/Toasts/components/Toast'
import useAlert from '../../hooks/useAlert'
import useError from '../../hooks/useError'
import { useWindowSize } from '../../hooks/useWindowSize'
import TasksAPI from '../../http/task.http'
import { TASK_MODEL } from '../../models'
import {
    EXPIRES_DATE,
    dateFormated,
    dateIsInRange,
    dateRenderer,
    groupByDate,
    handleApiError,
    isBeforeToday,
    moveItems,
    objToFlatArray,
    reorderItems,
} from '../../utilities/helpers'
import EditTaskModal from './EditTaskModal'
import FilterBar from './filter-bar/FilterBar'
import HomeTableHeader from './home-table-heading'
import TodoInputBar from './todo-input-bar/TodoInputBar'

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
}))

const Homepage = () => {
    const showError = useError()
    const { triggerAlert } = useAlert()
    const [searchInput, setSearchInput] = useState('')
    const [tasks, setTasks] = useState(null)
    const [dateFilter, setDateFilters] = useState('')
    const [priority, setPriority] = useState(false)
    const [openedTask, setOpenedTask] = useState(null)
    const [showEditModal, setShowEditModal] = useState(false)

    const classes = useStyles()

    const { width } = useWindowSize()
    const isMobile = width < 600

    useEffect(() => {
        fetchTasks()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const fetchTasks = async () => {
        try {
            const { data } = await TasksAPI.getTasks()
            setTasks(groupByDate(data))
        } catch (error) {
            handleApiError({
                error,
                handleGeneralError: showError,
            })
        }
    }

    /**
     * Edit task
     * @param oldTask
     * @param newTask
     * @param isUndo
     * @param newIndex
     * @returns {Promise<void>}
     */
    const onEditTask = async (oldTask, newTask, isUndo = true, newIndex) => {
        try {
            const { data } = await TasksAPI.editTask(newTask)
            triggerAlert({
                severity: SEVERITY_KEYS.success,
                title: 'A new task has been update to successfully',
                position: POSITION_TOASTS.rightBottom,
            })
            onUpdateItem(oldTask, data, isUndo, newIndex)
        } catch (error) {
            handleApiError({
                error,
                handleGeneralError: showError,
            })
        }
    }
    const onUpdateItem = (oldItem, updatedItem, isUndo, newIndex) => {
        let newTasks = tasks
        const indexOfOldTask = tasks[oldItem[TASK_MODEL.date]].findIndex(
            task => task[TASK_MODEL.id] === oldItem[TASK_MODEL.id]
        )

        const isDateChanged =
            dateFormated(updatedItem[TASK_MODEL.date]) !==
                dateFormated(oldItem[TASK_MODEL.date]) &&
            !(
                isBeforeToday(oldItem[TASK_MODEL.date]) &&
                isBeforeToday(updatedItem[TASK_MODEL.date])
            )

        if (isDateChanged) {
            //remove the task from old list

            if (isBeforeToday(oldItem[TASK_MODEL.date])) {
                newTasks[EXPIRES_DATE] = newTasks[EXPIRES_DATE].filter(
                    ({ [TASK_MODEL.id]: id }) =>
                        id !== updatedItem[TASK_MODEL.id]
                )
            } else {
                newTasks[oldItem[TASK_MODEL.date]] = newTasks[
                    oldItem[TASK_MODEL.date]
                ].filter(
                    ({ [TASK_MODEL.id]: id }) =>
                        id !== updatedItem[TASK_MODEL.id]
                )
            }

            //add the task in new list
            if (isBeforeToday(updatedItem[TASK_MODEL.date])) {
                newTasks[EXPIRES_DATE].push(updatedItem)
            } else {
                if (updatedItem[TASK_MODEL.date] in newTasks) {
                    if (newIndex === undefined) {
                        newTasks[updatedItem[TASK_MODEL.date]].push(updatedItem)
                    } else {
                        newTasks[updatedItem[TASK_MODEL.date]].splice(
                            newIndex,
                            0,
                            updatedItem
                        )
                    }
                } else {
                    newTasks[updatedItem[TASK_MODEL.date]] = [updatedItem]
                }
            }
        } else {
            //update the task in the same list
            if (isBeforeToday(updatedItem[TASK_MODEL.date])) {
                const taskToUpdateIndex = newTasks[EXPIRES_DATE].findIndex(
                    task => task[TASK_MODEL.id] === updatedItem[TASK_MODEL.id]
                )
                newTasks[EXPIRES_DATE][taskToUpdateIndex] = updatedItem
            } else {
                const taskToUpdateIndex = newTasks[
                    updatedItem[TASK_MODEL.date]
                ].findIndex(
                    task => task[TASK_MODEL.id] === updatedItem[TASK_MODEL.id]
                )
                newTasks[updatedItem[TASK_MODEL.date]][taskToUpdateIndex] =
                    updatedItem
            }
        }

        setTasks({ ...newTasks })
        const taskToUpdateIndex = tasks[updatedItem[TASK_MODEL.date]].findIndex(
            task => task[TASK_MODEL.id] === updatedItem[TASK_MODEL.id]
        )

        if (isUndo) {
            const orderedTasks = moveItems(
                tasks[updatedItem[TASK_MODEL.date]],
                tasks[oldItem[TASK_MODEL.date]],
                {
                    droppableId: updatedItem[TASK_MODEL.date],
                    index: taskToUpdateIndex,
                },
                {
                    droppableId: oldItem[TASK_MODEL.date],
                    index: indexOfOldTask,
                }
            )
            triggerAlert({
                severity: SEVERITY_KEYS.undo,
                title: 'Was it updated by mistake?',
                position: POSITION_TOASTS.rightBottom,
                delay: 5000,
                action: async () => {
                    const { data } = await TasksAPI.editTask(oldItem)
                    setTasks(prevTasks => {
                        const result = {
                            ...prevTasks,
                            ...orderedTasks,
                        }
                        result[oldItem[TASK_MODEL.date]][indexOfOldTask] = data
                        onOrderTasks(result)
                        return result
                    })
                },
            })
        }
    }

    /**
     * Delete Task
     * @param task
     * @param index
     * @param isUndo
     * @returns {Promise<void>}
     */
    const onDeleteTask = async (task, index, isUndo = true) => {
        try {
            await TasksAPI.deleteTask(task[TASK_MODEL.id])
            triggerAlert({
                severity: SEVERITY_KEYS.success,
                title: 'A new task has been delete to successfully',
                position: POSITION_TOASTS.rightBottom,
            })
            onDeleteItem(task[TASK_MODEL.date], index, isUndo)
        } catch (error) {
            handleApiError({
                error,
                handleGeneralError: showError,
            })
        }
    }
    const onDeleteItem = (key, index, isUndo) => {
        let newTasks = tasks
        const deletedTask = tasks[key][index]

        //remember that key is => date
        //check if is Expired

        newTasks[isBeforeToday(key) ? EXPIRES_DATE : key].splice(index, 1)
        setTasks({ ...newTasks })

        isUndo &&
            triggerAlert({
                severity: SEVERITY_KEYS.undo,
                title: 'Was it delete by mistake?',
                position: POSITION_TOASTS.rightBottom,
                delay: 5000,
                action: async () => {
                    const { data } = await TasksAPI.addTask(deletedTask)

                    setTasks(prevTasks => {
                        const tasks = [...prevTasks[key]]
                        tasks.splice(index, 0, data)
                        const result = {
                            ...prevTasks,
                            [key]: tasks,
                        }
                        onOrderTasks(result)
                        return result
                    })
                },
            })
    }

    /**
     * On order tasks after d&d event
     * @param orderedItems: list after d&d event
     * @returns {Promise<void>}
     */
    const onOrderTasks = async orderedItems => {
        const newTasks = objToFlatArray(orderedItems).map(
            el => el[TASK_MODEL.id]
        )
        try {
            await TasksAPI.orderTasks(newTasks)
        } catch (error) {
            handleApiError({
                error,
                handleGeneralError: showError,
            })
        }
    }
    const onDragEnd = result => {
        const { source, destination } = result
        // dropped outside the list
        if (!destination) {
            return
        }
        const sInd = source.droppableId
        const dInd = destination.droppableId
        const newState = { ...tasks }

        if (sInd === dInd) {
            newState[sInd] = reorderItems(
                tasks[sInd],
                source.index,
                destination.index
            )
            setTasks({ ...newState })
        } else {
            const result = moveItems(
                tasks[sInd],
                tasks[dInd],
                source,
                destination
            )
            newState[sInd] = result[sInd]
            newState[dInd] = result[dInd]
            const task = newState[dInd][destination.index]
            onEditTask(
                task,
                { ...task, [TASK_MODEL.date]: dInd },
                true,
                destination.index
            )
            setTasks({ ...newState })
        }

        onOrderTasks(newState)
    }

    /**
     * Add Task
     * @param task
     * @param isUndo
     * @returns {Promise<void>}
     */
    const onAddTasks = async (task, isUndo = true) => {
        const { data } = await TasksAPI.addTask(task)
        triggerAlert({
            severity: SEVERITY_KEYS.success,
            title: 'A new task has been created to successfully',
            position: POSITION_TOASTS.rightBottom,
        })
        onAddItem(data, isUndo)
    }

    const onAddItem = (newItem, isUndo) => {
        let newTasks = tasks
        if (newItem?.[TASK_MODEL.date] in newTasks) {
            newTasks[newItem?.[TASK_MODEL.date]].push(newItem)
        } else {
            newTasks[newItem?.[TASK_MODEL.date]] =
                newTasks[newItem?.[TASK_MODEL.date]] || []
            newTasks[newItem?.[TASK_MODEL.date]].push(newItem)
        }

        setTasks(groupByDate(Object.values(newTasks).flat()))

        isUndo &&
            triggerAlert({
                severity: SEVERITY_KEYS.undo,
                title: 'Was it created by mistake?',
                position: POSITION_TOASTS.rightBottom,
                delay: 5000,
                action: () => {
                    onDeleteTask(
                        newItem,
                        newTasks[newItem[TASK_MODEL.date]].findIndex(
                            task =>
                                task[TASK_MODEL.id] === newItem[TASK_MODEL.id]
                        ),
                        false
                    )
                },
            })
    }

    const filteredTasks = useMemo(() => {
        const filtered = {}
        if (tasks) {
            Object.keys(tasks).forEach(date => {
                const filteredDate = tasks[date].filter(t => {
                    const isInDate = dateFilter
                        ? dateIsInRange(
                              t[TASK_MODEL.date],
                              dateFilter?.[0],
                              dateFilter?.[1]
                          )
                        : true
                    const isInSearch = searchInput
                        ? t[TASK_MODEL.description].includes(searchInput)
                        : true
                    const isInPriority = priority
                        ? t[TASK_MODEL.effort] === priority.value
                        : true
                    return isInDate && isInSearch && isInPriority
                })
                if (filteredDate.length) filtered[date] = filteredDate
            })
        }
        return filtered
    }, [tasks, dateFilter, searchInput, priority])

    return (
        <>
            <FilterBar
                onSearchHandler={setSearchInput}
                onDateChangeHandler={setDateFilters}
                dateFilter={dateFilter}
                onPriorityHandler={setPriority}
            />
            <HomeTableHeader />
            <Container className={classes.taskBodyRoot}>
                <Row>
                    <Column start={2} span={10}>
                        <DragDropContext onDragEnd={onDragEnd}>
                            {filteredTasks &&
                                Object.keys(filteredTasks)?.map(date => (
                                    <Droppable
                                        key={date}
                                        droppableId={`${date}`}
                                        isDropDisabled={date === EXPIRES_DATE}
                                    >
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                            >
                                                <div
                                                    className={classes.section}
                                                >
                                                    <div
                                                        key={date}
                                                        className={
                                                            classes.sectionHeading
                                                        }
                                                    >
                                                        {dateRenderer(date)}
                                                    </div>
                                                    {filteredTasks[date]?.map(
                                                        (task, index) => (
                                                            <Draggable
                                                                key={task.id}
                                                                draggableId={`item-${task.id}`}
                                                                index={index}
                                                            >
                                                                {(
                                                                    provided,
                                                                    snapshot
                                                                ) => (
                                                                    <Task
                                                                        task={
                                                                            task
                                                                        }
                                                                        index={
                                                                            index
                                                                        }
                                                                        isLast={
                                                                            tasks[
                                                                                date
                                                                            ]
                                                                                ?.length -
                                                                                1 ===
                                                                            index
                                                                        }
                                                                        ref={
                                                                            provided.innerRef
                                                                        }
                                                                        onDeleteCb={
                                                                            onDeleteTask
                                                                        }
                                                                        onUpdateCb={
                                                                            onEditTask
                                                                        }
                                                                        onEditCb={() => {
                                                                            setOpenedTask(
                                                                                task
                                                                            )
                                                                            setShowEditModal(
                                                                                true
                                                                            )
                                                                        }}
                                                                        draggableProps={
                                                                            provided.draggableProps
                                                                        }
                                                                        dragHandleProps={
                                                                            provided.dragHandleProps
                                                                        }
                                                                    />
                                                                )}
                                                            </Draggable>
                                                        )
                                                    )}
                                                </div>
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                ))}
                        </DragDropContext>
                    </Column>
                </Row>
            </Container>
            {showEditModal && !isMobile && (
                <EditTaskModal
                    onClose={() => {
                        setShowEditModal(false)
                    }}
                    task={openedTask}
                    onUpdateCb={onEditTask}
                />
            )}
            <TodoInputBar
                task={isMobile && openedTask}
                onCancelCb={setOpenedTask}
                onAddTaskCb={onAddTasks}
                onEditTaskCb={onEditTask}
            />
        </>
    )
}

export default Homepage
