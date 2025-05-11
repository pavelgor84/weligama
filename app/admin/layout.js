import { Lato } from 'next/font/google'

const lato = Lato({ subsets: ['latin'], weight: ['100', '300', '400'] })

import styles from './lay.module.css'

export const metadata = {
  title: 'Property hub',
  description: 'Add and edit your properties',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={lato.className} style={{
        boxSizing: "border-box",
        padding: "0", margin: "0"
      }}>
        <div className={styles.container}>
          <div className={styles.menu}>
            <div className={styles.left_items}>
              <div className={styles.logo}>
                PropertyHub
              </div>
              <div className={styles.left_links}>
                <a href='#'>Add property</a>
                <a href='#'>Edit property</a>
              </div>
            </div>
            <div className={styles.right_items}>
              <div className={styles.email}>user@gmail.com</div>
            </div>
          </div>
        </div>
        {children}
        <div>FOOTER</div>

      </body>
    </html>
  )
}
