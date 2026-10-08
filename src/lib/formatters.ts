/**
 * Format numbers as Egyptian Pounds (ج.م) - أرقام عربية بدون فواصل عشرية
 */
export function formatCurrency(amount: number | undefined | null, currency = 'ج.م'): string {
  if (amount === undefined || amount === null || isNaN(amount)) return `0 ${currency}`;
  return `${Math.round(Number(amount)).toLocaleString('ar-EG')} ${currency}`;
}
/**
 * Format dates into clean Arabic formatted strings
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format dates with time into clean Arabic format
 */
export function formatDateTime(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Calculate difference in days between today and target date
 */
export function getDaysUntilExpiry(expiryDate: string): number {
  try {
    const target = new Date(expiryDate).getTime();
    const today = new Date().getTime();
    const diff = target - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  } catch {
    return 999;
  }
}

/**
 * Generate unique codes with timestamps and counters
 */
export function generateCode(prefix: string, count: number): string {
  const pad = String(count + 1).padStart(4, '0');
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${pad}`;
}
