"use client"

import Admin from '../admin/admin'
import AdminEdit from '../adminEdit/adminEdit'
import { useState } from 'react'
import styles from './list.module.css'

export default function AdminMenu({ email }) {

    const [tabToggle, setTabToggle] = useState(1)

    return (
        <>
            <div className={styles.block}>
                <div className={tabToggle === 1 ? styles.tabSelected : styles.tab} onClick={() => setTabToggle(1)}>ADD</div>
                <div className={tabToggle === 2 ? styles.tabSelected : styles.tab} onClick={() => setTabToggle(2)}>EDIT</div>
            </div>
            {tabToggle === 1 ? (<Admin email={email} />) : null}
            {tabToggle === 2 ? (<AdminEdit email={email} />) : null}
        </>
    )
}