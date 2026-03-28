/**
 * Formats a Stellar amount string or number to show up to 7 decimal places
 * and trims any trailing zeros.
 * 
 * @param amount The amount to format
 * @returns A formatted string with up to 7 decimal places and no trailing zeros
 */
export function formatAmount(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return '0';
  
  // Stellar supports up to 7 decimal places.
  // Using toFixed(7) ensures we don't exceed that precision and avoid scientific notation for small numbers.
  // The regex removes trailing zeros and the decimal point if it becomes unnecessary.
  return num.toFixed(7).replace(/\.?0+$/, '');
}
