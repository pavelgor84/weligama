
import { auth } from '@/auth'
import styles from './list.module.css'
import Admin from '@/components/admin/admin'


export default async function list() {
    const session = await auth()
    console.log(session)


    return (
        <div>ADMIN
            {session && (<Admin email={session.user.email} />)}

        </div>
    )
}