import type { SecurityIndicator } from '@passtore/core';

const LABELS: Record<SecurityIndicator, string> = {
  strong: 'Fuerte',
  weak: 'Débil',
  duplicate: 'Duplicada',
  compromised: 'Comprometida',
};

export function SecurityBadge({ status }: { status: SecurityIndicator }) {
  const cls =
    status === 'strong'
      ? 'badge badge-strong'
      : status === 'weak'
        ? 'badge badge-weak'
        : 'badge';
  return <span className={cls}>{LABELS[status]}</span>;
}
