// Shared country list for the admin address dropdown and API validation.
// Stored value is always the ISO 3166-1 alpha-2 code (e.g. "LK").
// The UI shows "LK — Sri Lanka" so users pick from a fixed list (no typos),
// while the server accepts ANY valid 2-letter code so future countries
// don't break saves for codes not yet in this list.

export const COUNTRIES = [
    { code: 'LK', name: 'Sri Lanka' },
    { code: 'IT', name: 'Italy' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'ES', name: 'Spain' },
    { code: 'PT', name: 'Portugal' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'BE', name: 'Belgium' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'AT', name: 'Austria' },
    { code: 'IE', name: 'Ireland' },
    { code: 'GR', name: 'Greece' },
    { code: 'TR', name: 'Türkiye' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'IN', name: 'India' },
    { code: 'TH', name: 'Thailand' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'SG', name: 'Singapore' },
    { code: 'AU', name: 'Australia' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'JP', name: 'Japan' },
    { code: 'CN', name: 'China' },
    { code: 'RU', name: 'Russia' },
    { code: 'CA', name: 'Canada' },
    { code: 'BR', name: 'Brazil' },
    { code: 'ZA', name: 'South Africa' },
]

/** True if value is a 2-letter uppercase ISO alpha-2 code (any country). */
export function isValidCountry(code) {
    return typeof code === 'string' && /^[A-Z]{2}$/.test(code)
}
