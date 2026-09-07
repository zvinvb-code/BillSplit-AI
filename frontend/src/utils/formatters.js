/**
 * Utility functions for currency and confidence formatting (defaults to Indian Rupee ₹)
 */

export function formatCurrency(amount, currency = '₹') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${currency}0.00`;
  }
  const numericAmount = Number(amount);
  // Format with Indian numbering system (lakhs, crores) if ₹
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
 * Strict confidence rules:
 * >= 0.90 -> High confidence
 * 0.75–0.89 -> Medium confidence
 * < 0.75 -> Low confidence
 */
export function getConfidenceBadge(score) {
  const s = Number(score) || 0;
  if (s >= 0.90) {
    return {
      tier: 'high',
      label: 'High confidence',
      percentage: `${Math.round(s * 100)}%`,
      bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400',
      textColor: 'text-emerald-400',
    };
  } else if (s >= 0.75) {
    return {
      tier: 'medium',
      label: 'Medium confidence',
      percentage: `${Math.round(s * 100)}%`,
      bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-400',
      textColor: 'text-amber-400',
    };
  } else {
    return {
      tier: 'low',
      label: 'Low confidence',
      percentage: `${Math.round(s * 100)}%`,
      bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-400',
      textColor: 'text-rose-400',
    };
  }
}
