import styles from '../components/header/header.module.css'
import CurrencySwitcher from '@/components/currencySwitcher/CurrencySwitcher'
import PriceFilter from '@/components/priceFilter/PriceFilter'
import AmenityFilterArea from '@/components/amenityFilter/AmenityFilterArea'

export default function Header() {
    return (
        <div className={styles.container}>
            <CurrencySwitcher />
            <div className={styles.filterRow}>
                <PriceFilter />
                <AmenityFilterArea />
            </div>

        </div>
    )
}
