'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { section: 'Prospecting', items: [
    { label: 'Prospects', href: '/prospects', icon: '⬡' },
    { label: 'Companies', href: '/companies', icon: '⬡' },
    { label: 'Contacts', href: '/contacts', icon: '⬡' },
  ]},
  { section: 'Pipeline', items: [
    { label: 'Pipeline', href: '/pipeline', icon: '⬡' },
    { label: 'Meetings', href: '/meetings', icon: '⬡' },
    { label: 'Follow-ups', href: '/followups', icon: '⬡', badge: 7 },
  ]},
  { section: 'Intelligence', items: [
    { label: 'AI Insights', href: '/insights', icon: '⬡' },
    { label: 'Settings', href: '/settings', icon: '⬡' },
  ]},
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      minWidth: 'var(--sidebar-w)',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
    }}>
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
          White Rabbit
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, letterSpacing: '0.04em' }}>
          Operational Intelligence
        </div>
      </div>

      <nav style={{ padding: '12px 0', flex: 1, overflowY: 'auto' }}>
        {nav.map(group => (
          <div key={group.section} style={{ padding: '0 12px', marginBottom: 4 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', padding: '8px 8px 4px' }}>
              {group.section}
            </div>
            {group.items.map(item => {
              const active = path.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 8px',
                  borderRadius: 6,
                  fontSize: 13,
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: active ? 'var(--bg)' : 'transparent',
                  fontWeight: active ? 500 : 400,
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 8, opacity: 0.4 }}>●</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {'badge' in item && item.badge && (
                    <span style={{
                      fontSize: 10, background: '#fef3c7', color: '#92400e',
                      padding: '1px 6px', borderRadius: 10, fontWeight: 500,
                    }}>{item.badge}</span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-tertiary)' }}>
        White Rabbit OS™ v0.1
      </div>
    </aside>
  )
}
