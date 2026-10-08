import styles from './HomeProofBand.module.css'

type ProofItem = {
  label: string
  value: string
}

export default function HomeProofBand({
  events,
  cities,
  since,
  proof = [],
}: {
  events: number
  cities: number
  since: number | null
  proof?: ProofItem[]
}) {
  const stats = [
    events > 0 ? { label: 'Past work', value: `${events} events` } : null,
    cities > 0 ? { label: 'Reach', value: `${cities} cities` } : null,
    since ? { label: 'Archive', value: `Since ${since}` } : null,
  ].filter((item): item is ProofItem => Boolean(item))

  if (stats.length === 0 && proof.length === 0) return null

  return (
    <section className={styles.band} aria-label="DJ B.A.E. verified work history">
      <div className={styles.inner}>
        <div className={styles.stats}>
          {stats.map((item) => (
            <div key={item.label} className={styles.fact}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>

        {proof.length > 0 ? (
          <div className={styles.proof}>
            {proof.slice(0, 2).map((item) => (
              <div key={`${item.label}-${item.value}`} className={styles.proofItem}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
