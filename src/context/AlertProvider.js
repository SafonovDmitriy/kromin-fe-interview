import React, { createContext, useCallback, useReducer } from 'react'
import { v4 as uuidv4 } from 'uuid'
import Toasts from '../components/Toasts'
export const AlertContext = createContext(null)

const SET_ALERT_DATA_ACTION = 'SET_ALERT_DATA'
const SET_VISIBILITY_ACTION = 'SET_VISIBILITY'
const RESET_ALERT_ACTION = 'RESET_ALERT'
const TRIGGER_ALERT_ACTION = 'TRIGGER_ALERT'
const REMOVE_ONE_ALERT_ACTION = 'REMOVE_ONE_ALERT'

const alertReducer = (state, action) => {
    switch (action.type) {
        case SET_ALERT_DATA_ACTION:
            return {
                ...state,
                data: [...state.data, { ...action.payload, id: uuidv4() }], // data: { severity: 'success', title: 'my title', description: 'my desc'}
            }
        case RESET_ALERT_ACTION:
            return {
                ...state,
                data: [],
            }
        case TRIGGER_ALERT_ACTION:
            return {
                ...state,
                data: [...state.data, { ...action.payload, id: uuidv4() }],
            }
        case REMOVE_ONE_ALERT_ACTION:
            return {
                ...state,
                data: state.data.filter(({ id }) => id !== action.payload),
            }
        default:
            return state
    }
}

const AlertProvider = ({ children }) => {
    const initialState = {
        isOpen: false,
        data: [],
    }
    const [alert, dispatch] = useReducer(alertReducer, initialState)

    const closeAlert = useCallback(() => {
        dispatch({ type: SET_VISIBILITY_ACTION, payload: { isOpen: false } })
    }, [])

    const showAlert = useCallback(() => {
        dispatch({ type: SET_VISIBILITY_ACTION, payload: { isOpen: true } })
    }, [])

    const setAlertData = useCallback(payload => {
        dispatch({ type: SET_ALERT_DATA_ACTION, payload })
    }, [])

    const triggerAlert = useCallback(payload => {
        dispatch({ type: TRIGGER_ALERT_ACTION, payload })
    }, [])

    const removeAlert = useCallback(payload => {
        dispatch({ type: REMOVE_ONE_ALERT_ACTION, payload })
    }, [])

    return (
        <AlertContext.Provider
            value={{
                dispatchAlert: dispatch,
                isAlertOpen: alert.isOpen,
                alertData: alert.data,
                closeAlert,
                showAlert,
                setAlertData,
                triggerAlert,
                removeAlert,
            }}
        >
            <Toasts />
            {children}
        </AlertContext.Provider>
    )
}

export default AlertProvider
