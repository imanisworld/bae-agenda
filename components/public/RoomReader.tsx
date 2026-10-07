'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import styles from './RoomReader.module.css'

const QUESTIONS = [
  {
    id: 'crowd',
    label: 'Who is in the room?',
    options: ['Mixed ages', 'Here to dance', 'Social-first', 'Music-heads'],
  },
  {
    id: 'arc',
    label: 'How should the night move?',
    options: ['Background → party', 'Warm → loud', 'Peak early', 'Stay in the groove'],
  },
  {
    id: 'priority',
    label: 'What matters most?',
    options: ['Familiar singalongs', 'Genre range', 'Smooth pacing', 'Surprise me'],
  },
] as const

type Answers = Record<(typeof QUESTIONS)[number]['id'], string>

const DEFAULTS: Answers = {
  crowd: 'Mixed ages',
  arc: 'Background → party',
  priority: 'Smooth pacing',
}

function approachFor(answers: Answers) {
  const crowd =
    answers.crowd === 'Mixed ages'
      ? 'Start broad enough that nobody feels shut out.'
      : answers.crowd === 'Here to dance'
        ? 'Get to rhythm quickly and keep the transitions moving.'
        : answers.crowd === 'Social-first'
          ? 'Leave room for conversation before asking more from the dance floor.'
          : 'Give the room deeper cuts and more intentional left turns.'

  const arc =
    answers.arc === 'Background → party'
      ? 'Build in stages instead of treating hour one like peak hour.'
      : answers.arc === 'Warm → loud'
        ? 'Let familiarity do the early work, then push the energy.'
        : answers.arc === 'Peak early'
          ? 'Establish the party fast, then manage the reset so the night still has somewhere to go.'
          : 'Favor continuity and pocket over constant energy spikes.'

  const priority =
    answers.priority === 'Familiar singalongs'
      ? 'Use recognizable records as anchors, not the entire set.'
      : answers.priority === 'Genre range'
        ? 'Change lanes without making the room feel like it changed DJs.'
        : answers.priority === 'Smooth pacing'
          ? 'Protect the flow first; the right record matters more than the obvious record.'
          : 'Leave space for the unexpected once the room has earned the turn.'

  return [crowd, arc, priority]
}

export default function RoomReader() {
  const [answers, setAnswers] = useState<Answers>(DEFAULTS)
  const approach = useMemo(() => approachFor(answers), [answers])

  return (
    <section className={styles.section} aria-labelledby="room-reader-title">
      <div className={styles.inner}>
        <div className={styles.heading}>
          <div>
            <span className={styles.kicker}>Read the room</span>
            <h2 id="room-reader-title">Give me three things.</h2>
          </div>
          <p>
            This is not a playlist generator. It shows how the same DJ can approach very different rooms.
          </p>
        </div>

        <div className={styles.questions}>
          {QUESTIONS.map((question, questionIndex) => (
            <fieldset key={question.id} className={styles.question}>
              <legend>
                <span>{String(questionIndex + 1).padStart(2, '0')}</span>
                {question.label}
              </legend>
              <div className={styles.optionRail}>
                {question.options.map((option) => {
                  const active = answers[question.id] === option
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={active}
                      className={active ? styles.optionActive : styles.option}
                      onClick={() => setAnswers((current) => ({ ...current, [question.id]: option }))}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <div className={styles.result} aria-live="polite">
          <div>
            <span className={styles.resultLabel}>How I&apos;d approach it</span>
            <h3>{answers.crowd} · {answers.arc}</h3>
          </div>
          <ol>
            {approach.map((line) => <li key={line}>{line}</li>)}
          </ol>
          <div className={styles.actions}>
            <Link href="/portfolio" className="btn-ghost">See comparable rooms</Link>
            <Link href="/lab" className="btn-ghost">Hear the range</Link>
            <Link href="/book" className="btn-primary">Tell me about yours →</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
