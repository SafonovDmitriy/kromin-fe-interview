import { useEffect, useState } from 'react'
import { createUseStyles } from 'react-jss'

const useStyles = createUseStyles(theme => ({
    timerWrapper: { position: 'relative', width: '30px', height: '30px' },
    timerCounter: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: '#ED6A5E',
        fontFamily: 'Arial, sans-serif',
        fontSize: '10px',
    },
}))

const Timer = ({ ms }) => {
    const classes = useStyles()
    const [remainingTime, setRemainingTime] = useState(ms / 1000)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const timeout = setInterval(() => {
            setRemainingTime(prevTime => prevTime - 1)
            setProgress(prevProgress => prevProgress + (1 / (ms / 1000)) * 100)
        }, 1000)
        return () => {
            clearInterval(timeout)
        }
    }, [ms])

    if (remainingTime <= 0) return <></>

    return (
        <div className={classes.timerWrapper}>
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 30 30"
                xmlns="http://www.w3.org/2000/svg"
                className="timer-svg"
            >
                <circle
                    cx="15"
                    cy="15"
                    r="14"
                    fill="none"
                    stroke="#ED6A5E"
                    strokeWidth="2"
                />
                <circle
                    cx="15"
                    cy="15"
                    r="14"
                    fill="none"
                    stroke="#687076"
                    strokeWidth="2"
                    strokeDasharray={`${progress} 90`}
                    className="timer-fill"
                    transform="rotate(-90 15 15)"
                />
            </svg>
            <div className={classes.timerCounter}>{remainingTime}</div>
        </div>
    )
}
export default Timer
