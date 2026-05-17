export default function ScoreBadge({ score }: { score: number }) {
  const color = score >= 75 ? 'var(--score-hot)' : score >= 50 ? 'var(--score-warm)' : 'var(--score-cold)'
  const label = score >= 75 ? 'hot' : score >= 50 ? 'warm' : 'cold'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 18, fontWeight: 500, color, lineHeight: 1 }}>{score}</span>
      <div>
        <div style={{ width: 44, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 10, color, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      </div>
    </div>
  )
}
