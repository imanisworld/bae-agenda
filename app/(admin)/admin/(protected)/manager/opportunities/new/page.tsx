import AdminNotice from '@/components/admin/AdminNotice'
import ManagerOpportunityForm from '@/components/admin/ManagerOpportunityForm'
import PageHeader from '@/components/admin/PageHeader'
import { createManagerOpportunityAction } from '@/app/actions/manager'

function getMessage(value: string | string[] | undefined) {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export default async function NewManagerOpportunityPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string | string[] }>
}) {
  const params = searchParams ? await searchParams : undefined
  const errorMessage = getMessage(params?.error)

  return (
    <div className="admin-page admin-page--narrow">
      <PageHeader
        title="Add Opportunity"
        subtitle="Start with manual leads. Discovery agents will use this exact record later."
        action={{ label: 'Back To Manager', href: '/admin/manager' }}
      />

      {errorMessage && <AdminNotice message={errorMessage} />}

      <div className="admin-preview-banner" style={{ marginBottom: 18 }}>
        <span className="admin-preview-mark" aria-hidden="true">+</span>
        <div>
          <div className="admin-preview-title">No outreach is sent from this form</div>
          <p>
            This only creates a private Manager lead. Applications, messages, contracts, and paid commitments remain separate approval steps.
          </p>
        </div>
      </div>

      <ManagerOpportunityForm
        action={createManagerOpportunityAction}
        mode="create"
      />
    </div>
  )
}
