"use client"

import React, { useState, useEffect } from 'react'
import styles from './roomAmenities.module.css'
import { AMENITY_CATEGORIES } from './roomAmenityCatalog'

/**
 * Per-room "Select additional amenities" section.
 *
 * Props:
 *   amenities — array of amenity ids currently selected for this room
 *   onConfirm — (ids) => void, called with the full new id list
 *               (modal Confirm and single-item remove both go through it)
 *   disabled  — optional, disables the ADD button (e.g. while saving)
 */
export default function RoomAmenities({ amenities = [], onConfirm, disabled = false }) {
    const [modalOpen, setModalOpen] = useState(false)
    // Draft checkbox state — only exists while the modal is open
    const [draft, setDraft] = useState([])

    const openModal = () => {
        setDraft([...amenities])
        setModalOpen(true)
    }

    const closeModal = () => setModalOpen(false)

    // Escape closes the modal (same as Cancel — discards the draft)
    useEffect(() => {
        if (!modalOpen) return
        const onKey = (e) => { if (e.key === 'Escape') setModalOpen(false) }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [modalOpen])

    const toggleDraft = (id) => {
        setDraft(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const handleConfirm = () => {
        onConfirm(draft)
        setModalOpen(false)
    }

    // Remove one amenity: send the full list minus that id
    const handleRemove = (id) => {
        onConfirm(amenities.filter(x => x !== id))
    }

    return (
        <div className={styles.amenities_section}>
            <h2 className={styles.section_title}>Select additional amenities</h2>
            {(amenities.length > 0) && (
                <div className={styles.selected_groups}>
                    {AMENITY_CATEGORIES.map((cat) => {
                        const selected = cat.items.filter(item => amenities.includes(item.id))
                        if (selected.length === 0) return null
                        return (
                            <div key={cat.label} className={styles.category_group}>
                                <h3 className={styles.category_title}>{cat.label}</h3>
                                <ul className={styles.amenities_list}>
                                    {selected.map((item) => (
                                        <li key={item.id} className={styles.amenity_item}>
                                            <span className={styles.amenity_label}>{item.label}</span>
                                            <button type="button" className={styles.amenity_remove} onClick={() => handleRemove(item.id)} aria-label={'Remove ' + item.label}>×</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )
                    })}
                </div>
            )}
            <button type="button" className={styles.add_button} disabled={disabled} onClick={openModal}>ADD</button>

            {modalOpen && (
                <div className={styles.modal_overlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3 className={styles.modal_title}>Select additional amenities</h3>
                        {AMENITY_CATEGORIES.map((cat) => (
                            <div key={cat.label} className={styles.category_group}>
                                <h4 className={styles.category_title}>{cat.label}</h4>
                                {cat.items.map((item) => (
                                    <label key={item.id} className={styles.checkbox_row}>
                                        <input
                                            type="checkbox"
                                            checked={draft.includes(item.id)}
                                            onChange={() => toggleDraft(item.id)}
                                        />
                                        <span>{item.label}</span>
                                    </label>
                                ))}
                            </div>
                        ))}
                        <div className={styles.modal_actions}>
                            <button type="button" className={styles.cancel_button} onClick={closeModal}>Cancel</button>
                            <button type="button" className={styles.confirm_button} onClick={handleConfirm}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
