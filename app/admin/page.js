
import { auth } from '@/auth'
import styles from './list.module.css'
import AdminMenu from '@/components/adminMenu/adminMenu'


export default async function AdminBlock() {
    const session = await auth()
    console.log(session)


    return (
        <div className={styles.container}>
            {session && (<AdminMenu email={session.user.email} />)}

        </div>
    )
}