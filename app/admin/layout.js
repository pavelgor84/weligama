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
        padding: "0", margin: "0",
        backgroundColor: "#bdced4"
      }}>

        {children}
        <footer className={styles.footer}>
          <div className={styles.footerContainer}>
            <div className={styles.footerSection}>
              <h4>About Us</h4>
              <p>Villas for rent nearby. Affordable and comfortable villas for your perfect vacation experience.</p>
            </div>
            <div className={styles.footerSection}>
              <h4>Contact Us</h4>
              <ul>
                <li>Email: <a href="mailto:pavelgor@gmail.com">pavelgor@gmail.com</a></li>
                {/* <li>Phone: +1 (123) 456-7890</li> */}
              </ul>
            </div>
            <div className={styles.footerSection}>
              <h4>Follow Us</h4>
              <ul className={styles.socialLinks}>
                <li><a href="#">Facebook</a></li>
                <li><a href="#">Twitter</a></li>
                <li><a href="#">Instagram</a></li>
              </ul>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>&copy; {new Date().getFullYear()} Made by Pavel Gorbushin.</p>
          </div>
        </footer>

      </body>
    </html>
  )
}
