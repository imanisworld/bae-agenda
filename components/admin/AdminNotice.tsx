interface AdminNoticeProps {
  message: string
}

export default function AdminNotice({ message }: AdminNoticeProps) {
  return (
    <div
      style={{
        background: 'rgba(244, 63, 94, 0.08)',
        border: '1px solid rgba(244, 63, 94, 0.24)',
        color: '#fecdd3',
        padding: '14px 16px',
        marginBottom: '24px',
        fontSize: '12px',
        lineHeight: 1.6,
      }}
    >
      {message}
    </div>
  )
}
