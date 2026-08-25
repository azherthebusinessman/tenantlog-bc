export function EmptyState({
  title,
  message,
  action,
}: {
  title: string
  message: string
  action?: React.ReactNode
}) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{message}</p>
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  )
}
