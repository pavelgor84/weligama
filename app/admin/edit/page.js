import { auth } from '@/auth'
//import styles from './list.module.css'
import AdminEdit from '@/components/adminEdit/adminEdit'


export default async function AdminBlock() {
    const session = await auth()
    console.log(session)


    return (
        <div >
            {session && (<AdminEdit email={session.user.email} />)}

        </div>
    )
}