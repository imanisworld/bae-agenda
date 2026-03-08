import Link from 'next/link'
import PageHeader from '@/components/admin/PageHeader'
import { createMixAction } from '@/app/actions/mixes'

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    background: 'var(--off-black)',
    border: '1px solid var(--border)',
    color: 'var(--white)',
    padding: '11px 13px',
    fontSize: '13px',
    fontFamily: 'DM Sans, sans-serif',
  }
}

export default function NewMixPage() {
  return (
    <div style={{ padding: '40px 48px', maxWidth: '900px' }}>
      <PageHeader
        title="New Mix"
        subtitle="Create a mix for the public catalog and featured sections."
        action={{ label: 'Back To Mixes', href: '/admin/mixes' }}
      />

      <form action={createMixAction} className="admin-section" style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Title *</span>
            <input name="title" required style={inputStyle()} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Genre</span>
              <input name="genre" style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Duration (seconds)</span>
              <input name="duration" type="number" min={0} style={inputStyle()} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Embed URL</span>
              <input name="embed_url" type="url" style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Cover URL</span>
              <input name="cover_url" type="url" style={inputStyle()} />
            </label>
          </div>

          <label style={{ display: 'grid', gap: '7px' }}>
            <span className="admin-section-title">Description</span>
            <textarea name="description" rows={4} style={inputStyle()} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Sort Order</span>
              <input name="sort_order" type="number" min={0} defaultValue={0} style={inputStyle()} />
            </label>
            <label style={{ display: 'grid', gap: '7px' }}>
              <span className="admin-section-title">Published At</span>
              <input name="published_at" type="datetime-local" style={inputStyle()} />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--white)' }}>
              <input type="checkbox" name="published" defaultChecked />
              Published
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--white)' }}>
              <input type="checkbox" name="is_featured" />
              Featured On Homepage
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
            <button type="submit" className="admin-btn-primary">
              Create Mix
            </button>
            <Link href="/admin/mixes" className="admin-btn-ghost">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
