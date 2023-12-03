import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import isToday from 'dayjs/plugin/isToday'
import isTomorrow from 'dayjs/plugin/isTomorrow'
import { TASK_MODEL } from '../models'

export const EXPIRES_DATE = 'Expired'

export const handleApiError = ({
    error,
    handleGeneralError = console.log,
    handleFormError = console.log,
}) => {
    const { response: { data } = {} } = error
    Object.keys(data).forEach(errorFieldName => {
        const rawErrorValue = data[errorFieldName]
        if (errorFieldName === 'message') {
            // Generic error
            handleGeneralError(rawErrorValue)
        } else {
            // Form field error
            const message = Array.isArray(rawErrorValue)
                ? rawErrorValue.join(' ')
                : rawErrorValue
            handleFormError(errorFieldName, { message })
        }
    })
}

export const saferun = (callback, params) => {
    if (typeof callback === 'function') {
        params ? callback(params) : callback()
    }
}

export const isBeforeToday = dateToCompare =>
    dayjs(new Date(dateToCompare)).isBefore(
        dayjs(new Date().toLocaleDateString('en-US'), 'day')
    )

export const dateRenderer = date => {
    dayjs.extend(isTomorrow)
    dayjs.extend(isToday)

    if (dayjs(new Date(date)).isToday()) {
        return 'Today'
    } else if (dayjs(new Date(date)).isTomorrow()) {
        return 'Tomorrow'
    } else {
        return date === EXPIRES_DATE ? date : dayjs(date).format('DD-MM-YYYY')
    }
}
export const dateFormated = date => dayjs(date).format('YYYY-MM-DD')

const EFFORT_LIST = {
    1: '!',
    2: '!!',
    3: '!!!',
}
export const effortRenderer = effort => EFFORT_LIST[effort] || ''

export const groupByDate = (array, isIncrementally = true) =>
    Object.groupBy(
        array.sort((a, b) =>
            isIncrementally
                ? new Date(a.date) - new Date(b.date)
                : new Date(b.date) - new Date(a.date)
        ),
        task =>
            isBeforeToday(task.date) ? [EXPIRES_DATE] : [task[TASK_MODEL.date]]
    )

export const reorderItems = (list, startIndex, endIndex) => {
    const result = Array.from(list)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)

    return result
}

export const moveItems = (
    source,
    destination,
    droppableSource,
    droppableDestination
) => {
    if (droppableSource.droppableId === droppableDestination.droppableId)
        return {
            [droppableSource.droppableId]: source,
            [droppableDestination.droppableId]: destination,
        }
    const sourceClone = Array.from(source)
    const destClone = Array.from(destination)
    const [removed] = sourceClone.splice(droppableSource.index, 1)

    destClone.splice(droppableDestination.index, 0, removed)

    return {
        [droppableSource.droppableId]: sourceClone,
        [droppableDestination.droppableId]: destClone,
    }
}

export const objToFlatArray = obj => Object.values(obj).flat()

export const formatDate = (
    date,
    formatType = 'YYYY-MM-DD',
    currentLanguage = 'en'
) => (date ? dayjs(date).locale(currentLanguage).format(formatType) : '-')

export const dateIsInRange = (date, startDate, endDate) => {
    dayjs.extend(isBetween)
    return date ? dayjs(date).isBetween(startDate, endDate, 'day', '[]') : true
}

export const retrieveSingleValueForRs = (options, value) => {
    if (value === null || value === '' || value === undefined) return null
    return options.find(option => option.value.toString() === value.toString())
}

export const getDateAndIndex = (task, tasksList) => {
    const date = isBeforeToday(task[TASK_MODEL.date])
        ? EXPIRES_DATE
        : task[TASK_MODEL.date]
    const index = tasksList[date].findIndex(
        ({ [TASK_MODEL.id]: id }) => id === task.id
    )
    return { date, index }
}

export function debounce(func, timeout = 300) {
    let timer
    return (...args) => {
        clearTimeout(timer)
        timer = setTimeout(() => {
            func.apply(this, args)
        }, timeout)
    }
}
export const getParams = data => {
    if (!data) return ''
    let params = !!Object.keys(data).length ? '?' : ''
    for (const key in data)
        if (!!data[key] || typeof data[key] === 'boolean')
            params += `${params.length > 1 ? '&' : ''}${key}=${data[key]}`

    return params
}
