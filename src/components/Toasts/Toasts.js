import { Fragment } from 'react'
import { createUseStyles } from 'react-jss'
import useAlert from '../../hooks/useAlert'
import Toast from './components/Toast'

const useStyles = createUseStyles(theme => {
    const stylesList = {
        position: 'absolute',
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    }
    return {
        toastListRT: {
            ...stylesList,
            top: '50px',
            right: '15px',
        },
        toastListRB: {
            ...stylesList,
            bottom: '50px',
            right: '15px',
        },
    }
})

const POSITION = { rightTop: 'rightTop', rightBottom: 'rightBottom' }

const Toasts = () => {
    const { alertData } = useAlert()
    const classes = useStyles()

    const toasts = alertData.reduce((acc, toast) => {
        const position = toast.position || POSITION.rightTop
        !!acc[position] ? acc[position].push(toast) : (acc[position] = [toast])
        return acc
    }, {})

    return (
        <>
            {!!toasts.rightTop && (
                <div className={classes.toastListRT}>
                    {toasts[POSITION.rightTop]?.map(toast => (
                        <Fragment key={toast.id}>
                            <Toast toast={toast} />
                        </Fragment>
                    ))}
                </div>
            )}
            {!!toasts.rightBottom && (
                <div className={classes.toastListRB}>
                    {toasts[POSITION.rightBottom]?.map(toast => (
                        <Fragment key={toast.id}>
                            <Toast toast={toast} />
                        </Fragment>
                    ))}
                </div>
            )}
        </>
    )
}
export default Toasts
