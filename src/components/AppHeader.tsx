import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useClearAll } from '../lib/tenantlog/hooks'

export function AppHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const clearAll = useClearAll()

  const isLanding = location.pathname === '/'

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-light)',
        background: 'var(--paper)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 920,
          margin: '0 auto',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          to="/issues"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            color: 'var(--ink)',
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: '1.0625rem',
              letterSpacing: '-0.01em',
            }}
          >
            TenantLog
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--ink-muted)',
              fontWeight: 500,
            }}
          >
            BC
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isLanding && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                if (confirm('Clear all locally stored data? This cannot be undone.')) {
                  clearAll.mutate()
                  navigate('/')
                }
              }}
              title="Remove all data from this browser"
            >
              Clear data
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
