import type { IssueStatus } from '../lib/tenantlog/types'
import { STATUS_LABELS } from '../lib/tenantlog/types'

export function StatusChip({ status }: { status: IssueStatus }) {
  return (
    <span className={`status-chip status-${status}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
