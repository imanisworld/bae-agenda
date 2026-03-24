/**
 * ADMIN — W-9
 * Store your tax info once. Download a clean W-9 PDF any time.
 * Data stored in site_content under w9_* keys.
 */
import PageHeader from '@/components/admin/PageHeader'
import W9Form    from '@/components/admin/W9Form'
import { getContentMap } from '@/lib/db/content'

export const dynamic = 'force-dynamic'

const W9_KEYS = [
  'w9_legal_name',
  'w9_business_name',
  'w9_classification',
  'w9_address',
  'w9_city_state_zip',
  'w9_tax_id',
]

export default async function W9Page() {
  const saved = await getContentMap(W9_KEYS)

  return (
    <div className="admin-page admin-page--narrow">
      <PageHeader
        title="W-9 Info"
        subtitle="Save your tax info here. Download a clean PDF to send to clients or venues anytime."
      />
      <W9Form saved={saved} />
    </div>
  )
}
