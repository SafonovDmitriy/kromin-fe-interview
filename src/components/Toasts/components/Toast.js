import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import { createUseStyles } from 'react-jss'
import checkCircle from '../../../assets/images/check-circle.svg'
import emojiSad from '../../../assets/images/emoji-sad.svg'
import closeImage from '../../../assets/images/eva_close-outline.svg'
import undoArrow from '../../../assets/images/undo.svg'

import useAlert from '../../../hooks/useAlert'
import Timer from './Timer'

const heightToast = 44

export const SEVERITY_KEYS = {
    error: 'error',
    success: 'success',
    undo: 'undo',
}
const SEVERITYS = {
    [SEVERITY_KEYS.error]: {
        background: '#CD2B31CC',
        image: emojiSad,
    },
    [SEVERITY_KEYS.success]: {
        background: '#18794ECC',
        image: checkCircle,
    },
    [SEVERITY_KEYS.undo]: { background: '#11181C', isTimer: true },
}

const useStyles = createUseStyles(theme => ({
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
        justifyContent: 'space-between',

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
    undoButton: {
        color: '#F07478',
        textAlign: 'center',
        fontFeatureSettings: `'case' on`,
        fontFamily: 'Inter',
        fontSize: '14px',
        fontStyle: 'normal',
        fontWeight: '500',
        lineHeight: '140%',
        display: 'flex',
        gap: '8px',
        cursor: 'pointer',
    },
}))

const Toast = ({ toast }) => {
    const toastRef = useRef(null)
    const { removeAlert } = useAlert()
    const stylesConfig = {
        ...SEVERITYS[toast?.severity],
    }
    const delay = toast?.delay || 3000
    const classes = useStyles(stylesConfig)

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            removeAlert(toast.id)
        }, delay)
        return () => {
            clearTimeout(timeoutId)
        }
    }, [delay, removeAlert, toast.id])

    useEffect(() => {
        gsap.from(toastRef.current, {
            y: heightToast,
        })

        gsap.to(toastRef.current, {
            duration: 0.5,
            opacity: 0,
            delay: delay / 1000 - 0.5,
        })
    }, [delay, toastRef])

    return (
        <div ref={toastRef} className={classes.alertWrapper}>
            {!!stylesConfig.image && <img src={stylesConfig.image} alt="" />}
            {!!stylesConfig.isTimer && <Timer ms={delay} />}
            <span className={classes.alertTitle}>{toast.title}</span>
            {toast?.severity === SEVERITY_KEYS.undo ? (
                <div
                    className={classes.undoButton}
                    onClick={() => {
                        toast.action?.()
                        removeAlert(toast.id)
                    }}
                >
                    <img src={undoArrow} alt="undo" />
                    Undo
                </div>
            ) : (
                <img
                    src={closeImage}
                    className="closeButton"
                    alt="close"
                    onClick={() => removeAlert(toast.id)}
                />
            )}
        </div>
    )
}
export default Toast
