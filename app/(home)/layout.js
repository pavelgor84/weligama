import { Lato } from 'next/font/google'
import '../globals.css'

import Header from '@/app/header'
import { CurrencyProvider } from '../context/CurrencyContext'
import { FilterProvider } from '../context/FilterContext'


const lato = Lato({ subsets: ['latin'], weight: ['400'] })

export const metadata = {
  title: 'Ceylon rooms',
  description: 'Direct rent in Sri-Lanka',
}

export default function RootLayout({ children }) {
  return (


    <html lang="en">
      <body className={lato.className}>
        <CurrencyProvider>
          <FilterProvider>
            <Header />
            {children}
          </FilterProvider>
        </CurrencyProvider>
        <div style={{ textAlign: "center" }}>Under development. pavelgor@gmail.com</div>
      </body>

    </html>

  )
}
