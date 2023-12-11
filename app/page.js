import Image from 'next/image'
import styles from './page.module.css'
import Icon_bed from '@/components/icons/Bed'
import Icon_shower from '@/components/icons/Shower'
import Icon_cond from '@/components/icons/Cond'


export default function Home() {
  return (
    <main className={styles.container}>
      <div className={styles.main}>
        <div className={styles.card_container}>
          <div className={styles.card_left}>left</div>
          <div className={styles.card_right}>
            <h3>Card title</h3>
            <div className={styles.card_right_options}>
              <Icon_bed /> 2 bedroom
              <Icon_shower /> 1 bath
              <Icon_cond /> a/c

            </div>
            <div className={styles.card_right_date}></div>
            <div className={styles.card_right_price}></div>
          </div>
        </div>
        <div className={styles.card_container}>
          <div className={styles.card_left}>left</div>
          <div className={styles.card_right}>
            <h3>Card title</h3>
            <div className={styles.card_right_options}></div>
            <div className={styles.card_right_date}></div>
            <div className={styles.card_right_price}></div>
          </div>
        </div>

      </div>
    </main>
  )
}
