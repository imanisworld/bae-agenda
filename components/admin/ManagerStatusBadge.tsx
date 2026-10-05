import {
  MANAGER_STATUS_LABELS,
  managerStatusStyle,
  type ManagerOpportunityStatus,
} from '@/lib/manager'

export default function ManagerStatusBadge({
  status,
}: {
  status: ManagerOpportunityStatus
}) {
  const style = managerStatusStyle(status)

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 9px',
        border: `1px solid ${style.border}`,
        borderRadius: 999,
        background: style.bg,
        color: style.color,
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {MANAGER_STATUS_LABELS[status]}
    </span>
  )
}
