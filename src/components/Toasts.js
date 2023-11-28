import { createUseStyles } from 'react-jss'
import useAlert from '../hooks/useAlert'
import { Fragment, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import emojiSad from '../assets/images/emoji-sad.svg'
import closeImage from '../assets/images/eva_close-outline.svg'
import checkCircle from '../assets/images/check-circle.svg'
const heightToast = 44
const useStyles = createUseStyles(theme => {
    return {
        toastList: {
            position: 'absolute',
            top: '50px',
            right: '15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
        },
        alertWrapper: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            background: props => props?.background || '#FFF',

            height: `${heightToast}px`,

            padding: '10px',
            borderRadius: '8px',
            gap: '10px',
            overflow: 'hidden',
            opacity: 50,
            '& img': {
                height: '16px',
            },
            '& img.closeButton': {
                height: '14px',
                alignSelf: 'flex-start',
                cursor: 'pointer',
            },
        },
        alertTitle: {
            color: '#FFF',
            fontFamily: 'Helvetica Now Display',
            fontSize: '14px',
            fontStyle: 'normal',
            fontWeight: '700',
            lineHeight: 'normal',
            letterSpacing: '0.3px',
        },
    }
})
const SEVERITYS = {
    error: {
        background: '#CD2B31CC',
        image: emojiSad,
    },
    success: {
        background: '#18794ECC',
        image: checkCircle,
    },
}

const Toasts = () => {
    const { alertData } = useAlert()
    console.log('alertData', alertData)
    const classes = useStyles()

    return (
        <div className={classes.toastList}>
            {alertData.map(toast => (
                <Fragment key={toast.id}>
                    <Toast toast={toast} />
                </Fragment>
            ))}
        </div>
    )
}
export default Toasts

const Toast = ({ toast }) => {
    const toastRef = useRef(null)
    const { removeAlert } = useAlert()
    const stylesConfig = {
        ...SEVERITYS[toast?.severity],
    }

    const classes = useStyles(stylesConfig)

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            removeAlert(toast.id)
        }, 3000)
        return () => {
            clearTimeout(timeoutId)
        }
    }, [])

    useEffect(() => {
        gsap.from(toastRef.current, {
            y: heightToast,
        })

        gsap.to(toastRef.current, {
            duration: 1,
            opacity: 0,
            delay: 2.5,
        })
    }, [toastRef])

    return (
        <div ref={toastRef} className={classes.alertWrapper}>
            <img src={stylesConfig.image} alt="" />
            <span className={classes.alertTitle}>{toast.title}</span>
            <img
                src={closeImage}
                className="closeButton"
                alt="close"
                onClick={() => removeAlert(toast.id)}
            />
        </div>
    )
}
