'use client'
import { useState } from 'react'
import { api } from '@/lib/api'

const industries = [
  { value: 'ecommerce', label: 'Ecommerce' },
  { value: 'logistics', label: 'Logistik' },
  { value: 'staffing', label: 'Bemanning / Rekrytering' },
  { value: 'construction', label: 'Bygg / Service' },
  { value: 'wholesale', label: 'Partihandel / Distribution' },
  { value: 'real_estate', label: 'Fastigheter' },
  { value: 'healthcare_admin', label: 'Vårdsadministration' },
  { value: 'b2b_sales', label: 'B2B-försäljning' },
]

export default function AddProspectModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ name: '', industry: 'ecommerce', revenue_msek: '', growth_pct: '', employees: '', hiring_signals: '', tech_stack: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.name) { setError('Ange företagsnamn'); return }
    setSaving(true)
    setError('')
    try {
      await api.prospects.create({
        name: form.name,
        industry: form.industry,
        revenue_msek: form.revenue_msek ? parseFloat(form.revenue_msek) : undefined,
        growth_pct: form.growth_pct ? parseFloat(form.growth_pct) : undefined,
        employees: form.employees ? parseInt(form.employees) : undefined,
        hiring_signals: form.hiring_signals || undefined,
        tech_stack: form.tech_stack ? form.tech_stack.split(',').map(s => s.trim()).filter(Boolean) : [],
        profitability: 'unknown',
      })
      onAdded()
      onClose()
    } catch {
      setError('Kunde inte spara — kontrollera att API:et körs.')
    }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 28, width: 480, maxWidth: '95vw' }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 20 }}>Lägg till prospect</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Företagsnamn *"><input value={form.name} onChange={e => set('name', e.target.value)} style={input} placeholder="Företag AB" /></Field>
          <Field label="Bransch">
            <select value={form.industry} onChange={e => set('industry', e.target.value)} style={input}>
              {industries.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Omsättning (MSEK)"><input value={form.revenue_msek} onChange={e => set('revenue_msek', e.target.value)} style={input} type="number" placeholder="95" /></Field>
            <Field label="Tillväxt %"><input value={form.growth_pct} onChange={e => set('growth_pct', e.target.value)} style={input} type="number" placeholder="34" /></Field>
          </div>
          <Field label="Antal anställda"><input value={form.employees} onChange={e => set('employees', e.target.value)} style={input} type="number" placeholder="52" /></Field>
          <Field label="Tech stack (kommaseparerat)"><input value={form.tech_stack} onChange={e => set('tech_stack', e.target.value)} style={input} placeholder="Fortnox, Shopify, Excel" /></Field>
          <Field label="Rekryteringssignaler"><input value={form.hiring_signals} onChange={e => set('hiring_signals', e.target.value)} style={input} placeholder="Söker ops-koordinator..." /></Field>
        </div>

        {error && <div style={{ fontSize: 12, color: '#e24b4a', marginTop: 10 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-sans)' }}>Avbryt</button>
          <button onClick={save} disabled={saving} style={{ flex: 2, padding: '9px', borderRadius: 7, border: 'none', background: 'var(--text-primary)', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-sans)' }}>
            {saving ? 'Sparar...' : 'Spara prospect'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  )
}

const input: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 6,
  border: '1px solid var(--border)', background: 'var(--bg)',
  fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
  outline: 'none',
}
