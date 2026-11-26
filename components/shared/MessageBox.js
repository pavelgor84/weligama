"use client"

import { useEffect, useRef } from 'react'
import styles from './messageBox.module.css'

/**
 * Centered modal message box used for operation feedback in the admin area.
 *
 * Usage:
 *   const [notice, setNotice] = useState(null)
 *   const showNotice = (type, message) => setNotice({ id: Date.now(), type, message })
 *   <MessageBox notice={notice} onClose={() => setNotice(null)} />
 *
 * notice: { id, type: 'success' | 'error', message } or null
 * Auto-closes after 5s and can be dismissed with the button.
 */
export default function MessageBox({ notice, onClose }) {
    // Keep the latest onClose without restarting the auto-dismiss timer on
    // every parent render (parents pass a new arrow function each time).
    const onCloseRef = useRef(onClose)
    onCloseRef.current = onClose

    useEffect(() => {
        if (!notice) return
        const timer = setTimeout(() => onCloseRef.current(), 5000)
        return () => clearTimeout(timer)
    }, [notice?.id])

    if (!notice) return null

    const isError = notice.type === 'error'

    return (
        <div className={styles.overlay} role="alertdialog" aria-modal="true" aria-live="assertive">
            <div className={`${styles.box} ${isError ? styles.error : styles.success}`}>
                <div className={styles.icon}>{isError ? '!' : '✓'}</div>
                <h2 className={styles.title}>{isError ? 'Something went wrong' : 'Success'}</h2>
                <p className={styles.message}>{notice.message}</p>
                <button type="button" className={styles.button} onClick={onClose}>OK</button>
            </div>
        </div>
    )
}
