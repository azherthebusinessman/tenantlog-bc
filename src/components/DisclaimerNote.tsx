export function DisclaimerNote({ variant = 'inline' }: { variant?: 'inline' | 'footer' }) {
  const text =
    'TenantLog BC stores your data only in this browser. It is not verified, certified, or a substitute for legal advice — it is your personal record.'

  if (variant === 'footer') {
    return (
      <div className="disclaimer-footer">
        {text}{' '}
        <span style={{ color: 'var(--ink-muted)' }}>
          Clearing your browser data will remove all logs.
        </span>
      </div>
    )
  }

  return <div className="disclaimer">{text}</div>
}
