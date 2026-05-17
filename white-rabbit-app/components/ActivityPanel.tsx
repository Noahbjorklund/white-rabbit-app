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
  const [showSummarize, setShowSummarize] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [summarizing, setSummarizing] = useState(false)
  const [summarizeMsg, setSummarizeMsg] = useState('')

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

  useEffect(() => {
    setShowSummarize(false)
    setTranscript('')
    setSummarizeMsg('')
  }, [companyId])

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

  async function runSummarize() {
    if (!transcript.trim()) return
    setSummarizing(true)
    setSummarizeMsg('')
    setError('')
    try {
      await api.ai.summarize({ transcript: transcript.trim(), company_id: companyId })
      setTranscript('')
      setShowSummarize(false)
      setSummarizeMsg('Summering klar — sparad som mötesaktivitet.')
      await load()
    } catch {
      setSummarizeMsg('Fel vid summering — kontrollera att API:et körs.')
    }
    setSummarizing(false)
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
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button
            onClick={logActivity}
            disabled={saving || !notes.trim()}
            style={{ ...primaryBtn, flex: 1 }}
          >
            {saving ? 'Sparar...' : '+ Logga'}
          </button>
          <button
            onClick={() => {
              setShowSummarize(s => !s)
              setSummarizeMsg('')
            }}
            style={{
              ...secondaryBtn,
              flex: 1,
              background: showSummarize ? 'var(--bg)' : 'var(--surface)',
              fontWeight: showSummarize ? 500 : 400,
            }}
          >
            ✦ AI-summering
          </button>
        </div>

        {showSummarize && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div style={{ ...sectionTitle, marginBottom: 6 }}>Mötestransskript</div>
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder="Klistra in mötesanteckningar eller transkript..."
              rows={6}
              style={{ ...input, resize: 'vertical', minHeight: 120 }}
            />
            <button
              onClick={runSummarize}
              disabled={summarizing || !transcript.trim()}
              style={{ ...primaryBtn, marginTop: 8 }}
            >
              {summarizing ? 'Analyserar...' : 'Analysera med Claude'}
            </button>
          </div>
        )}

        {summarizeMsg && (
          <div style={{
            fontSize: 12,
            color: summarizeMsg.startsWith('Fel') ? '#c00' : 'var(--score-hot)',
            marginTop: 10,
            padding: '8px 10px',
            background: summarizeMsg.startsWith('Fel') ? '#fff0f0' : '#e1f5ee',
            borderRadius: 6,
          }}>
            {summarizeMsg}
          </div>
        )}
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
            {(a.ai_pain_points?.length ?? 0) > 0 && (
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  AI-insikter
                </span>
                {a.ai_pain_points!.map((p, i) => (
                  <div key={i} style={{ marginTop: 3 }}>· {p}</div>
                ))}
                {a.ai_next_step && (
                  <div style={{ marginTop: 4, color: 'var(--score-hot)' }}>→ {a.ai_next_step}</div>
                )}
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
  padding: '8px', borderRadius: 7,
  background: 'var(--text-primary)', color: 'white',
  border: 'none', fontSize: 12, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'var(--font-sans)',
}

const secondaryBtn: React.CSSProperties = {
  padding: '8px', borderRadius: 7,
  background: 'var(--surface)', color: 'var(--text-primary)',
  border: '1px solid var(--border)', fontSize: 12,
  cursor: 'pointer', fontFamily: 'var(--font-sans)',
}
