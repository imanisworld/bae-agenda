/**
 * ADMIN CONTENT EDITOR
 * Allows editing core website copy stored in the site_content table.
 * Changes go live on the public site immediately after saving.
 */
import PageHeader      from '@/components/admin/PageHeader'
import ContentEditor   from '@/components/admin/ContentEditor'
import { getAllContent } from '@/lib/db/content'

export const dynamic = 'force-dynamic'

export default async function ContentPage() {
  const content = await getAllContent()

  return (
    <div style={{ padding: '40px 48px', maxWidth: '900px' }}>
      <PageHeader
        title="Content Editor"
        subtitle="Edit public-facing site copy. Changes go live immediately after saving."
      />
      <ContentEditor saved={content} />
    </div>
  )
}
