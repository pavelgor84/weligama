import Image from 'next/image'
import styles from './page.module.css'


export default function Home() {
  return (
    <main className={styles.container}>
      <div className={styles.main}>
        <div className={styles.card_container}>
          <div className={styles.card_left}></div>
          <div className={styles.card_right}>
            <h1>card title</h1>
            <div className={styles.card_right_options}></div>
            <div className={styles.card_right_date}></div>
            <div className={styles.card_right_price}></div>
          </div>
        </div>

      </div>
    </main>
  )
}
