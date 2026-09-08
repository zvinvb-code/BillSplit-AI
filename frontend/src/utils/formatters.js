/**
 * Utility functions for currency and confidence formatting (defaults to Indian Rupee ₹)
 */

export function formatCurrency(amount, currency = '₹') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${currency}0.00`;
  }
  const numericAmount = Number(amount);
  // Format with Indian numbering system (lakhs, crores) if ₹ or INR
  if (currency === '₹' || currency === 'INR') {
    return `₹${numericAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `${currency}${numericAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPercentage(val) {
  if (val === null || val === undefined || isNaN(val)) return '0%';
  return `${Number(val).toFixed(1)}%`;
}

/**
 * Strict confidence rules for modern light fintech theme:
 * >= 0.90 -> High confidence (Emerald)
 * 0.75–0.89 -> Medium confidence (Amber)
 * < 0.75 -> Low confidence (Rose)
 */
export function getConfidenceBadge(score) {
  const s = Number(score) || 0;
  if (s >= 0.90) {
    return {
      tier: 'high',
      label: 'High',
      percentage: `${Math.round(s * 100)}%`,
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      textColor: 'text-emerald-700',
    };
  } else if (s >= 0.75) {
    return {
      tier: 'medium',
      label: 'Medium',
      percentage: `${Math.round(s * 100)}%`,
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      textColor: 'text-amber-700',
    };
  } else {
    return {
      tier: 'low',
      label: 'Low',
      percentage: `${Math.round(s * 100)}%`,
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      textColor: 'text-rose-700',
    };
  }
}
