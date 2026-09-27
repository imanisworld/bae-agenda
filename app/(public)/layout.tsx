import PublicExperienceShell from '@/components/public/PublicExperienceShell'
import Footer from '@/components/public/Footer'
import StickyBookingCTA from '@/components/public/StickyBookingCTA'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicExperienceShell
      footer={<Footer />}
      sticky={<StickyBookingCTA />}
    >
      {children}
    </PublicExperienceShell>
  )
}
