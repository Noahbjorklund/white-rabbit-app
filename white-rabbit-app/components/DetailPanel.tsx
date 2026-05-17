'use client'
import { useEffect, useState } from 'react'
import type { Company } from '@/lib/api'
import { api } from '@/lib/api'
import ScoreBadge from './ScoreBadge'
import ActivityPanel from './ActivityPanel'

type Tab = 'intelligence' | 'activities'

export default function DetailPanel({ company, onUpdate }: { company: Company; onUpdate: () => void }) {
  const [tab, setTab] = useState<Tab>('intelligence')
  const [analyzing, setAnalyzing] = useState(false)
  const [pushing, setPushing] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    setTab('intelligence')
  }, [company.id])

  async function runAnalysis() {
    setAnalyzing(true)
    setMsg('')
    try {
      await api.ai.analyze({
        company_name: company.name,
        industry: company.industry,
        revenue_msek: company.revenue_msek ?? undefined,
        growth_pct: company.growth_pct ?? undefined,
        employees: company.employees ?? undefined,
        profitability: company.profitability,
        hiring_signals: company.hiring_signals ?? undefined,
        tech_stack: company.tech_stack,
        save_to_company: company.id,
      })
      setMsg('Analys klar!')
      onUpdate()
    } catch {
      setMsg('Fel vid analys — kontrollera att API:et körs.')
    }
    setAnalyzing(false)
  }

  async function pushCRM(crm: string) {
    setPushing(true)
    setMsg('')
    try {
      await api.ai.pushCRM(company.id, crm)
      setMsg(`Pushat till ${crm}!`)
      onUpdate()
    } catch {
      setMsg('Fel vid CRM-push — kontrollera API-nyckel.')
    }
    setPushing(false)
  }

  const tag = (text: string, color: string) => (
    <span style={{
      fontSize: 11, padding: '3px 8px', borderRadius: 4,
      background: color + '15', color, border: `1px solid ${color}30`,
    }}>{text}</span>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>{company.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 3 }}>{company.industry} · Stockholm, SE</div>
        <div style={{ marginTop: 12 }}>
          <ScoreBadge score={company.score} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0, padding: '0 20px' }}>
        {([
          { id: 'intelligence' as Tab, label: 'Intelligence' },
          { id: 'activities' as Tab, label: 'Aktiviteter' },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={tabBtn(tab === t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'intelligence' ? (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          {/* Score breakdown */}
          {Object.keys(company.score_breakdown || {}).length > 0 && (
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={sectionTitle}>Poängfördelning</div>
              {Object.entries(company.score_breakdown).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', padding: '2px 0' }}>
                  <span>{k}</span>
                  <span style={{ color: (v as number) > 0 ? 'var(--score-hot)' : '#e24b4a', fontWeight: 500 }}>{(v as number) > 0 ? '+' : ''}{v as number}</span>
                </div>
              ))}
            </div>
          )}

          {/* Pain points */}
          {company.pain_points?.length > 0 && (
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={sectionTitle}>Operationella problem</div>
              {company.pain_points.map((p, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '4px 0', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: '#854f0b', marginTop: 2, fontSize: 8 }}>●</span>{p}
                </div>
              ))}
            </div>
          )}

          {/* Automation opportunities */}
          {company.automation_opportunities?.length > 0 && (
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={sectionTitle}>Automationsmöjligheter</div>
              {company.automation_opportunities.map((a, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '4px 0', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--score-hot)', marginTop: 2, fontSize: 8 }}>●</span>{a}
                </div>
              ))}
            </div>
          )}

          {/* Tech stack */}
          {company.tech_stack?.length > 0 && (
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={sectionTitle}>Tech stack</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
                {company.tech_stack.map(s => tag(s, '#185fa5'))}
              </div>
            </div>
          )}

          {/* Sales angle */}
          {company.sales_angle && (
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={sectionTitle}>Säljvinkel</div>
              <div style={{
                fontSize: 12, fontWeight: 500, lineHeight: 1.6,
                padding: '10px 12px', background: 'var(--bg)',
                borderRadius: 6, borderLeft: '2px solid var(--text-primary)',
                marginTop: 6,
              }}>{company.sales_angle}</div>
            </div>
          )}

          {/* SDR notes */}
          {company.sdr_notes && (
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={sectionTitle}>SDR-anteckningar</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, fontFamily: 'var(--font-mono)', marginTop: 6 }}>
                {company.sdr_notes}
              </div>
            </div>
          )}

          {/* Estimated hours */}
          {company.estimated_hours_saved && (
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={sectionTitle}>Estimerade tidsbesparingar</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--score-hot)', marginTop: 4 }}>
                ~{company.estimated_hours_saved}h<span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 400 }}> / månad</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ padding: '16px 20px', marginTop: 'auto' }}>
            {msg && (
              <div style={{ fontSize: 12, color: 'var(--score-hot)', marginBottom: 10, padding: '8px 10px', background: '#e1f5ee', borderRadius: 6 }}>
                {msg}
              </div>
            )}
            <button onClick={runAnalysis} disabled={analyzing} style={primaryBtn}>
              {analyzing ? 'Analyserar...' : '✦ Kör AI-analys'}
            </button>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button onClick={() => pushCRM('hubspot')} disabled={pushing} style={secondaryBtn}>
                → HubSpot
              </button>
              <button onClick={() => pushCRM('pipedrive')} disabled={pushing} style={secondaryBtn}>
                → Pipedrive
              </button>
            </div>
          </div>
        </div>
      ) : (
        <ActivityPanel companyId={company.id} />
      )}
    </div>
  )
}

const sectionTitle: React.CSSProperties = {
  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em',
  color: 'var(--text-tertiary)', marginBottom: 8,
}

const tabBtn = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '10px 0',
  fontSize: 12,
  fontWeight: active ? 500 : 400,
  color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
  background: 'none',
  border: 'none',
  borderBottom: active ? '2px solid var(--text-primary)' : '2px solid transparent',
  marginBottom: -1,
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  transition: 'color 0.15s',
})

const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '9px', borderRadius: 7,
  background: 'var(--text-primary)', color: 'white',
  border: 'none', fontSize: 13, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'var(--font-sans)',
}

const secondaryBtn: React.CSSProperties = {
  flex: 1, padding: '8px', borderRadius: 7,
  background: 'var(--surface)', color: 'var(--text-primary)',
  border: '1px solid var(--border)', fontSize: 12,
  cursor: 'pointer', fontFamily: 'var(--font-sans)',
}
