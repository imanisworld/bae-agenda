export const MANAGER_OUTREACH_VERSION = 'v1'

export type ManagerOutreachChannel =
  | 'email'
  | 'instagram_dm'
  | 'application'
  | 'web_form'
  | 'phone'
  | 'other'

type OutreachProfile = {
  display_name?: string | null
  home_market?: string | null
  website_url?: string | null
  instagram_url?: string | null
  press_kit_url?: string | null
  genres?: string[] | null
}

type OutreachOpportunity = {
  title?: string | null
  organization?: string | null
  source_type?: string | null
  source_url?: string | null
  source_reference?: string | null
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  application_deadline?: string | null
  requirements?: string | null
  why_fit?: string | null
  recommended_demo?: string | null
}

type OutreachMix = {
  id?: string | null
  title?: string | null
  description?: string | null
  genre?: string | null
  embed_url?: string | null
  is_featured?: boolean | null
  sort_order?: number | null
}

export interface ManagerOutreachAsset {
  kind: 'website' | 'instagram' | 'press_kit' | 'mix'
  label: string
  url: string
  note?: string
}

export interface ManagerOutreachPrep {
  channel: ManagerOutreachChannel
  subject: string | null
  draft: string
  assets: ManagerOutreachAsset[]
  missingItems: string[]
  ready: boolean
  version: string
}

function normalize(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9&]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function words(value: string | null | undefined) {
  return new Set(
    normalize(value)
      .split(' ')
      .filter((word) => word.length > 2)
  )
}

function chooseChannel(opportunity: OutreachOpportunity): ManagerOutreachChannel {
  const combined = normalize([
    opportunity.title,
    opportunity.source_reference,
    opportunity.requirements,
    opportunity.source_url,
  ].filter(Boolean).join(' '))

  if (
    opportunity.application_deadline ||
    combined.includes('apply') ||
    combined.includes('application') ||
    combined.includes('job listing') ||
    combined.includes('linkedin job') ||
    combined.includes('career com')
  ) {
    return 'application'
  }

  if (opportunity.contact_email) return 'email'

  const source = normalize(opportunity.source_type)
  const url = normalize(opportunity.source_url)
  if (source === 'instagram' || url.includes('instagram com')) return 'instagram_dm'
  if (opportunity.source_url) return 'web_form'
  if (opportunity.contact_phone) return 'phone'
  return 'other'
}

function scoreMix(recommendedDemo: string | null | undefined, mix: OutreachMix) {
  if (!mix.embed_url) return -1

  const target = words(recommendedDemo)
  if (target.size === 0) return mix.is_featured ? 1 : 0

  const mixText = words([mix.title, mix.genre, mix.description].filter(Boolean).join(' '))
  let score = 0

  for (const token of target) {
    if (mixText.has(token)) score += 2
  }

  const normalizedGenre = normalize(mix.genre)
  const normalizedTarget = normalize(recommendedDemo)
  if (normalizedGenre && normalizedTarget.includes(normalizedGenre)) score += 5
  if (mix.is_featured) score += 1
  if (mix.sort_order === 1) score += 0.5

  return score
}

function pickMix(recommendedDemo: string | null | undefined, mixes: OutreachMix[]) {
  return mixes
    .map((mix) => ({ mix, score: scoreMix(recommendedDemo, mix) }))
    .filter(({ score }) => score >= 0)
    .sort((a, b) => b.score - a.score || (a.mix.sort_order ?? 999) - (b.mix.sort_order ?? 999))[0] ?? null
}

function greeting(opportunity: OutreachOpportunity) {
  if (opportunity.contact_name?.trim()) {
    const firstName = opportunity.contact_name.trim().split(/\s+/)[0]
    return `Hi ${firstName},`
  }
  if (opportunity.organization?.trim()) return `Hi ${opportunity.organization.trim()} team,`
  return 'Hi,'
}

function makeDraft(
  profile: OutreachProfile,
  opportunity: OutreachOpportunity,
  channel: ManagerOutreachChannel,
  demoAsset: ManagerOutreachAsset | null
) {
  const name = profile.display_name?.trim() || 'DJ B.A.E.'
  const market = profile.home_market?.trim() || 'Indianapolis'
  const org = opportunity.organization?.trim() || 'your team'
  const genres = (profile.genres ?? []).slice(0, 4).join(', ')
  const fit = opportunity.why_fit?.trim()
  const demoLine = demoAsset
    ? `You can hear a relevant mix here: ${demoAsset.url}`
    : profile.website_url
      ? `You can hear my work at ${profile.website_url}.`
      : ''

  if (channel === 'application') {
    return [
      greeting(opportunity),
      '',
      `I'm ${name}, an open-format DJ based in ${market}, and I'm interested in the ${opportunity.title ?? 'DJ opportunity'} with ${org}.`,
      genres ? `My sets regularly move through ${genres}.` : null,
      fit ? fit : null,
      demoLine || null,
      profile.instagram_url ? `Instagram: ${profile.instagram_url}` : null,
      '',
      'I would be glad to provide any additional mixes, availability, or event details you need. Thank you for considering me.',
      '',
      name,
    ].filter((line) => line !== null).join('\n')
  }

  const ask =
    channel === 'instagram_dm'
      ? `Are you currently booking DJs or accepting guest-DJ inquiries for upcoming ${org} events?`
      : `I'm reaching out to see whether you're currently booking DJs or accepting guest-DJ inquiries for upcoming ${org} programming.`

  return [
    greeting(opportunity),
    '',
    `I'm ${name}, an open-format DJ based in ${market}.`,
    ask,
    genres ? `I regularly play ${genres}.` : null,
    fit ? fit : null,
    demoLine || null,
    profile.website_url && !demoLine.includes(profile.website_url) ? `Website: ${profile.website_url}` : null,
    profile.instagram_url ? `Instagram: ${profile.instagram_url}` : null,
    '',
    'If the fit makes sense, I would love to discuss upcoming dates, format, and rates.',
    '',
    name,
  ].filter((line) => line !== null).join('\n')
}

export function prepareManagerOutreach(
  profile: OutreachProfile,
  opportunity: OutreachOpportunity,
  mixes: OutreachMix[]
): ManagerOutreachPrep {
  const channel = chooseChannel(opportunity)
  const assets: ManagerOutreachAsset[] = []
  const missingItems: string[] = []

  if (profile.website_url) {
    assets.push({ kind: 'website', label: 'Website', url: profile.website_url })
  }
  if (profile.instagram_url) {
    assets.push({ kind: 'instagram', label: 'Instagram', url: profile.instagram_url })
  }
  if (profile.press_kit_url) {
    assets.push({ kind: 'press_kit', label: 'Press Kit', url: profile.press_kit_url })
  }

  const bestMix = pickMix(opportunity.recommended_demo, mixes)
  let demoAsset: ManagerOutreachAsset | null = null

  if (bestMix?.mix.embed_url && bestMix.score >= 2) {
    demoAsset = {
      kind: 'mix',
      label: bestMix.mix.title || 'Recommended Mix',
      url: bestMix.mix.embed_url,
      note: opportunity.recommended_demo
        ? `Closest published match for ${opportunity.recommended_demo}.`
        : 'Closest published demo.',
    }
    assets.push(demoAsset)
  } else if (opportunity.recommended_demo) {
    missingItems.push(`No strong published mix match for: ${opportunity.recommended_demo}`)
  }

  if (channel === 'other') {
    missingItems.push('No verified contact or application route.')
  }
  if (channel === 'email' && !opportunity.contact_email) {
    missingItems.push('Contact email is missing.')
  }
  if (channel === 'phone' && !opportunity.contact_phone) {
    missingItems.push('Contact phone is missing.')
  }

  const requirements = normalize(opportunity.requirements)
  if ((requirements.includes('press kit') || requirements.includes('epk')) && !profile.press_kit_url) {
    missingItems.push('Press kit / EPK requested but no press-kit URL is saved.')
  }

  const subject =
    channel === 'email'
      ? `DJ inquiry — ${opportunity.organization || opportunity.title || 'upcoming programming'}`
      : channel === 'application'
        ? `Application — ${opportunity.title || 'DJ opportunity'}`
        : null

  return {
    channel,
    subject,
    draft: makeDraft(profile, opportunity, channel, demoAsset),
    assets,
    missingItems,
    ready: missingItems.length === 0,
    version: MANAGER_OUTREACH_VERSION,
  }
}
