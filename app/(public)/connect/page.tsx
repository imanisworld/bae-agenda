import { permanentRedirect } from 'next/navigation'

export default function ConnectPage() {
  permanentRedirect('/book#contact')
}
