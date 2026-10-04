import AdminNotice from '@/components/admin/AdminNotice'
import PageHeader from '@/components/admin/PageHeader'
import { updateManagerProfileAction } from '@/app/actions/manager'
import { joinManagerList } from '@/lib/manager'
import { createAdminClient } from '@/lib/supabase/admin'

interface ManagerProfile {
  display_name: string
  home_market: string | null
  minimum_fee: number | null
  target_hourly_rate: number | null
  max_drive_minutes: number | null
  max_one_way_miles: number | null
  minimum_notice_days: number | null
  preferred_event_types: string[] | null
  excluded_event_types: string[] | null
  target_markets: string[] | null
  target_brands: string[] | null
  genres: string[] | null
  equipment_notes: string | null
  travel_notes: string | null
  deal_breakers: string | null
  website_url: string | null
  instagram_url: string | null
  press_kit_url: string | null
  notes: string | null
}

const DEFAULT_PROFILE: ManagerProfile = {
  display_name: 'DJ B.A.E.',
  home_market: 'Indianapolis, IN',
  minimum_fee: null,
  target_hourly_rate: null,
  max_drive_minutes: null,
  max_one_way_miles: null,
  minimum_notice_days: null,
  preferred_event_types: [],
  excluded_event_types: [],
  target_markets: [],
  target_brands: [],
  genres: [],
  equipment_notes: null,
  travel_notes: null,
  deal_breakers: null,
  website_url: 'https://thebaeagenda.com',
  instagram_url: 'https://www.instagram.com/dj_b.a.e/',
  press_kit_url: null,
  notes: null,
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    minHeight: 48,
    padding: '11px 13px',
    border: '1px solid var(--border)',
    borderRadius: 10,
    background: 'var(--off-black)',
    color: 'var(--white)',
    fontSize: 13,
    fontFamily: 'DM Sans, sans-serif',
  }
}

function textAreaStyle(): React.CSSProperties {
  return {
    ...inputStyle(),
    minHeight: 108,
    resize: 'vertical',
  }
}

function getMessage(value: string | string[] | undefined) {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

async function getProfile(): Promise<{ configured: boolean; profile: ManagerProfile }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('manager_profiles')
      .select('display_name, home_market, minimum_fee, target_hourly_rate, max_drive_minutes, max_one_way_miles, minimum_notice_days, preferred_event_types, excluded_event_types, target_markets, target_brands, genres, equipment_notes, travel_notes, deal_breakers, website_url, instagram_url, press_kit_url, notes')
      .eq('profile_key', 'dj_bae')
      .maybeSingle()

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return { configured: false, profile: DEFAULT_PROFILE }
      }
      throw new Error(error.message || 'Unable to load manager profile.')
    }

    return {
      configured: true,
      profile: data ? { ...DEFAULT_PROFILE, ...data } as ManagerProfile : DEFAULT_PROFILE,
    }
  } catch {
    return { configured: false, profile: DEFAULT_PROFILE }
  }
}

export default async function ManagerProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string | string[]; success?: string | string[] }>
}) {
  const query = searchParams ? await searchParams : undefined
  const { configured, profile } = await getProfile()
  const errorMessage = getMessage(query?.error)
  const successMessage = getMessage(query?.success)

  return (
    <div className="admin-page admin-page--narrow">
      <PageHeader
        title="Manager Profile"
        subtitle="The rules the Manager will use to decide what is worth your time."
        action={{ label: 'Back To Manager', href: '/admin/manager' }}
      />

      {!configured && (
        <div className="admin-preview-banner" style={{ marginBottom: 18 }}>
          <span className="admin-preview-mark" aria-hidden="true">◈</span>
          <div>
            <div className="admin-preview-title">Preview values only</div>
            <p>
              The private Manager tables are not installed in this environment yet. These defaults are not saved until the schema is applied.
            </p>
          </div>
        </div>
      )}

      {errorMessage && <AdminNotice message={errorMessage} />}
      {successMessage && (
        <div className="admin-preview-banner" style={{ marginBottom: 16 }}>
          <span className="admin-preview-mark" aria-hidden="true">✓</span>
          <div><div className="admin-preview-title">{successMessage}</div></div>
        </div>
      )}

      <form action={updateManagerProfileAction}>
        <section className="admin-section" style={{ padding: 24, marginBottom: 16 }}>
          <div className="admin-section-header" style={{ margin: '-24px -24px 22px' }}>
            <span className="admin-section-title">Baseline</span>
          </div>

          <div className="admin-form-grid-two" style={{ marginBottom: 14 }}>
            <label style={{ display: 'grid', gap: 7 }}>
              <span className="admin-section-title">Name</span>
              <input name="display_name" required defaultValue={profile.display_name} style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: 7 }}>
              <span className="admin-section-title">Home Market</span>
              <input name="home_market" defaultValue={profile.home_market ?? ''} style={inputStyle()} />
            </label>
          </div>

          <div className="admin-form-grid-two" style={{ marginBottom: 14 }}>
            <label style={{ display: 'grid', gap: 7 }}>
              <span className="admin-section-title">Minimum Fee</span>
              <input name="minimum_fee" type="number" min={0} step="0.01" defaultValue={profile.minimum_fee ?? ''} style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: 7 }}>
              <span className="admin-section-title">Target Hourly Rate</span>
              <input name="target_hourly_rate" type="number" min={0} step="0.01" defaultValue={profile.target_hourly_rate ?? ''} style={inputStyle()} />
            </label>
          </div>

          <div className="admin-form-grid-two" style={{ marginBottom: 14 }}>
            <label style={{ display: 'grid', gap: 7 }}>
              <span className="admin-section-title">Max One-Way Drive (minutes)</span>
              <input name="max_drive_minutes" type="number" min={0} step={1} defaultValue={profile.max_drive_minutes ?? ''} style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: 7 }}>
              <span className="admin-section-title">Max One-Way Distance (miles)</span>
              <input name="max_one_way_miles" type="number" min={0} step="0.1" defaultValue={profile.max_one_way_miles ?? ''} style={inputStyle()} />
            </label>
          </div>

          <label style={{ display: 'grid', gap: 7 }}>
            <span className="admin-section-title">Minimum Notice (days)</span>
            <input name="minimum_notice_days" type="number" min={0} step={1} defaultValue={profile.minimum_notice_days ?? ''} style={inputStyle()} />
          </label>
        </section>

        <section className="admin-section" style={{ padding: 24, marginBottom: 16 }}>
          <div className="admin-section-header" style={{ margin: '-24px -24px 22px' }}>
            <span className="admin-section-title">What To Chase</span>
            <span className="muted">Comma-separated</span>
          </div>

          {[
            ['preferred_event_types', 'Preferred Event Types', joinManagerList(profile.preferred_event_types), 'Corporate events, club nights, birthdays...'],
            ['target_markets', 'Target Markets', joinManagerList(profile.target_markets), 'Indianapolis, Chicago, Cincinnati...'],
            ['target_brands', 'Target Brands / Categories', joinManagerList(profile.target_brands), 'Nike, fashion, nightlife, beverage...'],
            ['genres', 'Genres / Formats', joinManagerList(profile.genres), 'Open format, hip-hop, R&B...'],
            ['excluded_event_types', 'Avoid / Excluded Event Types', joinManagerList(profile.excluded_event_types), 'Anything you do not want the Manager chasing'],
          ].map(([name, label, value, placeholder]) => (
            <label key={name} style={{ display: 'grid', gap: 7, marginBottom: 14 }}>
              <span className="admin-section-title">{label}</span>
              <input name={name} defaultValue={value} placeholder={placeholder} style={inputStyle()} />
            </label>
          ))}
        </section>

        <section className="admin-section" style={{ padding: 24, marginBottom: 16 }}>
          <div className="admin-section-header" style={{ margin: '-24px -24px 22px' }}>
            <span className="admin-section-title">Rules + Logistics</span>
          </div>

          <label style={{ display: 'grid', gap: 7, marginBottom: 14 }}>
            <span className="admin-section-title">Deal Breakers</span>
            <textarea
              name="deal_breakers"
              rows={4}
              defaultValue={profile.deal_breakers ?? ''}
              placeholder="Unpaid work, unclear organizer, exclusivity, excessive travel without coverage..."
              style={textAreaStyle()}
            />
          </label>

          <label style={{ display: 'grid', gap: 7, marginBottom: 14 }}>
            <span className="admin-section-title">Travel Rules</span>
            <textarea name="travel_notes" rows={4} defaultValue={profile.travel_notes ?? ''} style={textAreaStyle()} />
          </label>

          <label style={{ display: 'grid', gap: 7 }}>
            <span className="admin-section-title">Equipment / Setup</span>
            <textarea name="equipment_notes" rows={4} defaultValue={profile.equipment_notes ?? ''} style={textAreaStyle()} />
          </label>
        </section>

        <section className="admin-section" style={{ padding: 24, marginBottom: 16 }}>
          <div className="admin-section-header" style={{ margin: '-24px -24px 22px' }}>
            <span className="admin-section-title">Manager Assets</span>
          </div>

          <label style={{ display: 'grid', gap: 7, marginBottom: 14 }}>
            <span className="admin-section-title">Website</span>
            <input name="website_url" type="url" defaultValue={profile.website_url ?? ''} style={inputStyle()} />
          </label>
          <label style={{ display: 'grid', gap: 7, marginBottom: 14 }}>
            <span className="admin-section-title">Instagram</span>
            <input name="instagram_url" type="url" defaultValue={profile.instagram_url ?? ''} style={inputStyle()} />
          </label>
          <label style={{ display: 'grid', gap: 7, marginBottom: 14 }}>
            <span className="admin-section-title">Press Kit</span>
            <input name="press_kit_url" type="url" defaultValue={profile.press_kit_url ?? ''} style={inputStyle()} />
          </label>
          <label style={{ display: 'grid', gap: 7 }}>
            <span className="admin-section-title">Internal Manager Notes</span>
            <textarea name="notes" rows={5} defaultValue={profile.notes ?? ''} style={textAreaStyle()} />
          </label>
        </section>

        <div className="admin-form-actions">
          <button type="submit" className="admin-btn-primary" disabled={!configured}>
            Save Manager Profile
          </button>
          <a href="/admin/manager" className="admin-btn-ghost">Cancel</a>
        </div>
      </form>
    </div>
  )
}
