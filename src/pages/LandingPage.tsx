import { useNavigate } from 'react-router-dom'
import { useSeedDemo } from '../lib/tenantlog/hooks'
import { DisclaimerNote } from '../components/DisclaimerNote'

export function LandingPage() {
  const navigate = useNavigate()
  const seedDemo = useSeedDemo()

  return (
    <div
      style={{
        minHeight: 'calc(100svh - 49px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 560 }}>
        <h1
          style={{
            fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
            lineHeight: 1.15,
            marginBottom: 12,
          }}
        >
          Document it while it happens.
        </h1>
        <p
          style={{
            fontSize: '1.0625rem',
            color: 'var(--ink-secondary)',
            lineHeight: 1.6,
            marginBottom: 8,
          }}
        >
          TenantLog BC is a private tool for B.C. renters to log housing issues as they
          happen — add updates over time, attach photos, and export a clean PDF record.
        </p>
        <p
          style={{
            fontSize: '0.9375rem',
            color: 'var(--ink-muted)',
            lineHeight: 1.6,
            marginBottom: 32,
          }}
        >
          No accounts. No cloud. Everything stays on your device.
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <button
            className="btn btn-primary"
            style={{ minWidth: 240, padding: '14px 28px', fontSize: '1rem' }}
            onClick={() => navigate('/issues')}
          >
            Start My Tenant Log
          </button>
          <button
            className="btn btn-secondary"
            style={{ minWidth: 240 }}
            onClick={() => {
              seedDemo.mutate(undefined, {
                onSuccess: () => navigate('/issues'),
              })
            }}
            disabled={seedDemo.isPending}
          >
            {seedDemo.isPending ? 'Loading demo…' : 'Try Demo'}
          </button>
        </div>

        <div style={{ marginTop: 32 }}>
          <DisclaimerNote />
        </div>
      </div>

      <DisclaimerNote variant="footer" />
    </div>
  )
}
