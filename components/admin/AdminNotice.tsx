interface AdminNoticeProps {
  message: string
}

export default function AdminNotice({ message }: AdminNoticeProps) {
  return (
    <div className="admin-notice" role="alert">
      <span aria-hidden="true">!</span>
      <p>{message}</p>
    </div>
  )
}
