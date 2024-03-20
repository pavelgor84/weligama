
import { auth } from '@/auth'
import styles from './list.module.css'
import Admin from '@/components/admin/admin'
import AdminMenu from '@/components/adminMenu/adminMenu'


export default async function list() {
    const session = await auth()
    console.log(session)


    return (
        <div className={styles.container}>
            {session && (<AdminMenu email={session.user.email} />)}

        </div>
    )
}