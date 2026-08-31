import { Lato } from 'next/font/google'
import '../globals.css'

import Header from '@/app/header'


const lato = Lato({ subsets: ['latin'], weight: ['400'] })

export const metadata = {
  title: 'Ceylon rooms',
  description: 'Direct rent in Sri-Lanka',
}

export default function RootLayout({ children }) {
  return (


    <html lang="en">
      <body className={lato.className}>
        <Header />
        {children}
        <div style={{ textAlign: "center" }}>Under development. pavelgor@gmail.com</div>
      </body>

    </html>

  )
}
