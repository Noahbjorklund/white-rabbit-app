'use client'
import { useCallback, useEffect, useState } from 'react'
import { api, type Activity, type ActivityType } from '@/lib/api'

const typeLabels: Record<ActivityType, string> = {
  call: 'Samtal',
  email: 'E-post',
  meeting: 'Möte',
  note: 'Anteckning',
  task: 'Uppgift',
}

const typeColors: Record<ActivityType, string> = {
  call: '#185fa5',
  email: '#6b4fa0',
  meeting: 'var(--score-hot)',
  note: 'var(--text-secondary)',
  task: 'var(--score-warm)',
}

export default function ActivityPanel({ companyId }: { companyId: number }) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [type, setType] = useState<ActivityType>('note')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.activities.list(companyId)
      setActivities(data)
    } catch {
      setError('Kunde inte ladda aktiviteter.')
    }
    setLoading(false)
  }, [companyId])

  useEffect(() => { load() }, [load])

  async function logActivity() {
    if (!notes.trim()) return
    setSaving(true)
    setError('')
    try {
      await api.activities.create({ company_id: companyId, type, notes: notes.trim() })
      setNotes('')
      await load()
    } catch {
      setError('Kunde inte spara aktivitet.')
    }
    setSaving(false)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={sectionTitle}>Logga aktivitet</div>
        <select value={type} onChange={e => setType(e.target.value as ActivityType)} style={input}>
          {(Object.keys(typeLabels) as ActivityType[]).map(t => (
            <option key={t} value={t}>{typeLabels[t]}</option>
          ))}
        </select>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Anteckningar..."
          rows={3}
          style={{ ...input, marginTop: 8, resize: 'vertical', minHeight: 64 }}
        />
        <button onClick={logActivity} disabled={saving || !notes.trim()} style={{ ...primaryBtn, marginTop: 8 }}>
          {saving ? 'Sparar...' : 'Spara aktivitet'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
        <div style={sectionTitle}>Historik</div>
        {error && (
          <div style={{ fontSize: 12, color: '#c00', marginBottom: 10 }}>{error}</div>
        )}
        {loading && (
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Laddar...</div>
        )}
        {!loading && activities.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
            Inga aktiviteter ännu.
          </div>
        )}
        {activities.map(a => (
          <div key={a.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 500,
                background: typeColors[a.type] + '15', color: typeColors[a.type],
                border: `1px solid ${typeColors[a.type]}30`,
              }}>{typeLabels[a.type]}</span>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{formatDate(a.activity_date)}</span>
            </div>
            {a.notes && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
                {a.notes}
              </div>
            )}
            {a.next_step && (
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                Nästa steg: {a.next_step}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const sectionTitle: React.CSSProperties = {
  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em',
  color: 'var(--text-tertiary)', marginBottom: 8,
}

const input: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 6,
  border: '1px solid var(--border)', background: 'var(--bg)',
  fontSize: 12, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
  outline: 'none',
}

const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '8px', borderRadius: 7,
  background: 'var(--text-primary)', color: 'white',
  border: 'none', fontSize: 12, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'var(--font-sans)',
}