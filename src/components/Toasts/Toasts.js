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
    const { alertData } = useAlert()
    const classes = useStyles()

    const toasts = Object.groupBy(alertData, ({ position }) => position)

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
