"use client"

import Admin from '../admin/admin'
import AdminEdit from '../adminEdit/adminEdit'
import { useState } from 'react'
import styles from './admin_menu.module.css'

export default function AdminMenu({ email }) {

    const [tabToggle, setTabToggle] = useState(1)

    return (
        <div className={styles.container}>
            <div className={styles.form}></div>

        </div>
    )
}