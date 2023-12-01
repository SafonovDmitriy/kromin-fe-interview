import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import isToday from 'dayjs/plugin/isToday'
import isTomorrow from 'dayjs/plugin/isTomorrow'

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

export const groupByDate = array =>
    array.reduce(
        (r, a) => {
            //check for the expired ones
            if (isBeforeToday(a.date)) {
                r[EXPIRES_DATE] = r[EXPIRES_DATE] || []
                r[EXPIRES_DATE].push(a)
            } else {
                r[a.date] = r[a.date] || []
                r[a.date].push(a)
            }
            return r
        },
        [...new Set(array.map(({ date }) => date))]
            .sort()
            .reduce((acc, key) => {
                acc[key] = []
                return acc
            }, {})
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

export const objToFlatArray = obj => {
    let result = []
    Object.keys(obj).forEach(key => {
        const array = obj[key]
        result = [...result, ...array]
    })

    return result
}

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
