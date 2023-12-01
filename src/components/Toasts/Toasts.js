import { Fragment } from 'react'
import { createUseStyles } from 'react-jss'
import useAlert from '../../hooks/useAlert'
import Toast, { SEVERITY_KEYS } from './components/Toast'

const useStyles = createUseStyles(theme => {
    const stylesList = {
        position: 'absolute',
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    }
    return {
        'toastList-rightTop': {
            ...stylesList,
            top: '50px',
            right: '15px',
        },
        'toastList-rightBottom': {
            ...stylesList,
            bottom: '50px',
            right: '15px',
        },
    }
})

export const POSITION_TOASTS = {
    rightTop: 'rightTop',
    rightBottom: 'rightBottom',
}

const Toasts = () => {
    const { removeAlert, alertData } = useAlert()
    const classes = useStyles()

    const toasts = Object.groupBy(alertData, ({ position }) => position)

    const undo = e => {
        var evtobj = window.event || e
        if (evtobj.keyCode === 90 && evtobj.ctrlKey) {
            const lastUndoToast = alertData
                .filter(({ severity }) => severity === SEVERITY_KEYS.undo)
                .at(-1)
            if (lastUndoToast) {
                lastUndoToast?.action?.()
                removeAlert(lastUndoToast.id)
            }
        }
    }

    document.onkeydown = undo
    return (
        <>
            {Object.values(POSITION_TOASTS).map(position => (
                <Fragment key={position}>
                    {toasts[position] ? (
                        <div className={classes[`toastList-${position}`]}>
                            {toasts[position]?.map(toast => (
                                <Fragment key={toast.id}>
                                    <Toast toast={toast} />
                                </Fragment>
                            ))}
                        </div>
                    ) : (
                        <></>
                    )}
                </Fragment>
            ))}
        </>
    )
}
export default Toasts
