'use client'
import { useEffect, useState, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import ProspectCard from '@/components/ProspectCard'
import DetailPanel from '@/components/DetailPanel'
import AddProspectModal from '@/components/AddProspectModal'
import { api, type Company } from '@/lib/api'

const filters = [
  { label: 'Alla', value: '' },
  { label: 'Ecommerce', value: 'ecommerce' },
  { label: 'Logistik', value: 'logistics' },
  { label: 'Bemanning', value: 'staffing' },
  { label: 'Bygg', value: 'construction' },
]

export default function ProspectsPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selected, setSelected] = useState<Company | null>(null)
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.prospects.list(filter ? { industry: filter } : undefined)
      setCompanies(data)
      if (selected) {
        const updated = data.find(c => c.id === selected.id)
        if (updated) setSelected(updated)
      }
    } catch {
      setError('Kunde inte nå API:et. Kontrollera att backenden körs på localhost:8000.')
    }
    setLoading(false)
  }, [filter, selected])

  useEffect(() => { load() }, [filter])

  const hot = companies.filter(c => c.score >= 75).length
  const analyzed = companies.filter(c => c.ai_analyzed_at).length
  const synced = companies.filter(c => c.crm_synced_at).length

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />

      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* List column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--border)' }}>
          {/* Topbar */}
          <div style={{ padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Prospect Discovery</div>
            <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, background: 'var(--text-primary)', color: 'white', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              + Lägg till
            </button>
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: '16px 24px 0', flexShrink: 0 }}>
            {[
              { label: 'Totalt', value: companies.length },
              { label: 'Heta leads', value: hot },
              { label: 'Analyserade', value: analyzed },
              { label: 'CRM-synkade', value: synced },
            ].map(m => (
              <div key={m.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 22, fontWeight: 500 }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ padding: '12px 24px', display: 'flex', gap: 6, flexShrink: 0 }}>
            {filters.map(f => (
              <button key={f.value} onClick={() => setFilter(f.value)} style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 11,
                border: '1px solid var(--border)',
                background: filter === f.value ? 'var(--text-primary)' : 'var(--surface)',
                color: filter === f.value ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}>{f.label}</button>
            ))}
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading && (
              <div style={{ paddingTop: 40, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Laddar prospects...</div>
            )}
            {error && (
              <div style={{ paddingTop: 20, padding: 16, background: '#fff0f0', border: '1px solid #fcc', borderRadius: 8, fontSize: 13, color: '#c00' }}>
                {error}
              </div>
            )}
            {!loading && !error && companies.length === 0 && (
              <div style={{ paddingTop: 60, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>⬡</div>
                Inga prospects ännu — klicka "+ Lägg till" för att börja.
              </div>
            )}
            {companies.map(c => (
              <ProspectCard
                key={c.id}
                company={c}
                selected={selected?.id === c.id}
                onClick={() => setSelected(c)}
              />
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div style={{ width: 340, minWidth: 340, background: 'var(--surface)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {selected ? (
            <DetailPanel company={selected} onUpdate={load} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)', textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.3 }}>⬡</div>
              <div style={{ fontSize: 13 }}>Välj ett prospect för att se intelligence</div>
            </div>
          )}
        </div>
      </main>

      {showAdd && <AddProspectModal onClose={() => setShowAdd(false)} onAdded={load} />}
    </div>
  )
}
