export default function PublicPageStage({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="public-page-stage">
      <div className="public-page-stage-glow" aria-hidden="true" />
      <div className="public-page-stage-scan" aria-hidden="true" />
      <div className="public-page-stage-inner">
        {children}
      </div>
    </div>
  )
}
