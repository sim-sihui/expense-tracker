/**
 * Format a number with commas and 2 decimal places.
 * e.g. 1234567.8 → "1,234,567.80"
 */
export function formatMoney(n) {
    const num = typeof n === 'string' ? parseFloat(n) : n
    if (isNaN(num)) return '0.00'
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
}
