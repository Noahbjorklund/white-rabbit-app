import type { Company } from '@/lib/api'
import ScoreBadge from './ScoreBadge'

interface Props {
  company: Company
  selected: boolean
  onClick: () => void
}

const industryLabel: Record<string, string> = {
  ecommerce: 'Ecommerce', logistics: 'Logistics', staffing: 'Staffing',
  construction: 'Construction', wholesale: 'Wholesale', real_estate: 'Real Estate',
  healthcare_admin: 'Healthcare', b2b_sales: 'B2B Sales',
}

export default function ProspectCard({ company, selected, onClick }: Props) {
  const initials = company.name.split(' ').map(w => w[0]).slice(0, 2).join('')

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${selected ? 'var(--text-primary)' : 'var(--border)'}`,
        borderRadius: 10,
        padding: '14px 18px',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'var(--bg)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', flexShrink: 0,
          }}>{initials}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{company.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
              {industryLabel[company.industry] || company.industry}
              {company.employees ? ` · ${company.employees} anst.` : ''}
              {company.revenue_msek ? ` · ${company.revenue_msek} MSEK` : ''}
            </div>
          </div>
        </div>
        <ScoreBadge score={company.score} />
      </div>

      {company.pain_points?.length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
          {company.pain_points.slice(0, 2).map((p, i) => (
            <span key={i} style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 4,
              background: 'var(--bg)', color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}>{p}</span>
          ))}
          {company.pain_points.length > 2 && (
            <span style={{ fontSize: 11, padding: '2px 8px', color: 'var(--text-tertiary)' }}>
              +{company.pain_points.length - 2} till
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 6, color: company.urgency === 'high' ? '#0f6e56' : company.urgency === 'medium' ? '#854f0b' : '#888' }}>●</span>
          {company.sales_angle
            ? company.sales_angle.slice(0, 60) + (company.sales_angle.length > 60 ? '…' : '')
            : 'Ej analyserad ännu'}
        </div>
        {company.crm_synced_at && (
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>CRM ✓</span>
        )}
      </div>
    </div>
  )
}
