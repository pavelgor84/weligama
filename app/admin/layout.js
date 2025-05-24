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
        <div>FOOTER</div>

      </body>
    </html>
  )
}
