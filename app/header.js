import styles from '../components/header/header.module.css'

export default function Header() {
    return (
        <div className={styles.container}>

            <div className={styles.title}>
                <div className={styles.title_header}>Weligama houses</div>
                <div className={styles.title_text}>Escape to paradise and experience the ultimate luxury at our exquisite villas in Weligama. Book your dream vacation today!</div>
            </div>

        </div>
    )
}