import React, { createContext, useCallback, useReducer } from 'react'
import { v4 as uuidv4 } from 'uuid'
import Toasts from '../components/Toasts/Toasts'

export const AlertContext = createContext(null)

const RESET_ALERT_ACTION = 'RESET_ALERT'
const TRIGGER_ALERT_ACTION = 'TRIGGER_ALERT'
const REMOVE_ONE_ALERT_ACTION = 'REMOVE_ONE_ALERT'

const alertReducer = (state, action) => {
    switch (action.type) {
        case RESET_ALERT_ACTION:
            return {
                ...state,
                data: [],
            }
        case TRIGGER_ALERT_ACTION:
            return {
                ...state,
                data: [
                    ...state.data,
                    { ...action.payload.toast, id: uuidv4() },
                ],
            }
        case REMOVE_ONE_ALERT_ACTION:
            return {
                ...state,
                data: state.data.filter(
                    ({ id }) => id !== action.payload.idToast
                ),
            }
        default:
            return state
    }
}

const AlertProvider = ({ children }) => {
    const initialState = {
        data: [],
    }
    const [alert, dispatch] = useReducer(alertReducer, initialState)

    const triggerAlert = useCallback(toast => {
        dispatch({ type: TRIGGER_ALERT_ACTION, payload: { toast } })
    }, [])

    const removeAlert = useCallback(idToast => {
        dispatch({ type: REMOVE_ONE_ALERT_ACTION, payload: { idToast } })
    }, [])

    return (
        <AlertContext.Provider
            value={{
                dispatchAlert: dispatch,
                isAlertOpen: alert.isOpen,
                alertData: alert.data,
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
