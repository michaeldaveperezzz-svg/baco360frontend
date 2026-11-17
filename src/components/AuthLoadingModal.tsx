import { createPortal } from 'react-dom'
import { LoaderCircle } from 'lucide-react'

interface Props {
  title: string
  message: string
}

export default function AuthLoadingModal({ title, message }: Props) {
  return createPortal(<div className="auth-loading-backdrop">
    <section className="auth-loading-dialog" role="status" aria-live="polite" aria-label={title}>
      <LoaderCircle className="auth-loading-spinner" size={34} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{message}</p>
    </section>
  </div>, document.body)
}
