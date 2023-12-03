import axios from './'
import { TASK_MODEL } from '../models'
import { getParams } from '../utilities/helpers'

const TasksAPI = {
    getTasks: data => {
        const url = `/todos${getParams(data)}`
        return axios.get(url)
    },
    getTasksCompleted: data => {
        const url = `/todos/completed${getParams(data)}`
        return axios.get(url)
    },
    addTask: data => {
        const url = '/todos'
        return axios.post(url, data)
    },
    editTask: data => {
        const url = `/todos/${data?.[TASK_MODEL.id]}`
        return axios.patch(url, data)
    },
    deleteTask: id => {
        const url = `/todos/${id}`
        return axios.delete(url)
    },
    orderTasks: data => {
        const url = '/todos/order'
        return axios.post(url, { todos: [...data] })
    },
    restoreTask: data => {
        const url = `/todos/${data[TASK_MODEL.id]}/restore`
        return axios.post(url, data)
    },
}

export default TasksAPI
