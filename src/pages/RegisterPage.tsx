import { useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, ShieldCheck, X } from 'lucide-react'
import Brand from '../components/Brand'
import GoogleSignInButton from '../components/GoogleSignInButton'

interface Props { 
  onRegister: (name: string, email: string, phone: string, password: string, passwordConfirmation: string) => Promise<{ email: string; verificationEmailSent: boolean }>
  onResendEmailVerification: (email: string) => Promise<void>
  onVerifyEmail: (email: string, code: string) => Promise<{ welcomeEmailSent: boolean }>
  onBack: () => void 
  onOpenLegal: (document: 'terms' | 'privacy') => void
  onGoogleSignIn: (idToken: string, intent: 'sign_in' | 'sign_up' | 'reactivate') => Promise<void>
  onRequireGoogleSignupConsent: (idToken: string) => void
  acceptedTerms: boolean
  onAcceptedTermsChange: (accepted: boolean) => void
  modal: true
}

export default function RegisterPage(props: Props) {
  const { onRegister, onResendEmailVerification, onVerifyEmail, onBack, onOpenLegal, onGoogleSignIn, onRequireGoogleSignupConsent, acceptedTerms, onAcceptedTermsChange, modal } = props
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [verificationModalOpen, setVerificationModalOpen] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationNotice, setVerificationNotice] = useState('')
  const [verificationError, setVerificationError] = useState('')
  const [verificationComplete, setVerificationComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password !== passwordConfirmation) {
      setError('Passwords do not match.')
      return
    }

    setIsRegistering(true)
    try {
      const result = await onRegister(name, email, phone, password, passwordConfirmation)
      setEmail(result.email)
      setVerificationCode('')
      setVerificationError('')
      setVerificationComplete(false)
      setVerificationNotice(result.verificationEmailSent
        ? ''
        : 'The account is pending verification, but the email could not be sent. Please request a new code.')
      setVerificationModalOpen(true)
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Registration failed. Please check your information.')
    } finally {
      setIsRegistering(false)
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setVerificationError('')
    setIsVerifying(true)
    try {
      const result = await onVerifyEmail(email, verificationCode)
      setVerificationComplete(true)
      setVerificationNotice(result.welcomeEmailSent
        ? 'Your account is ready. A welcome email has also been sent.'
        : 'Your account is ready, but the welcome email could not be sent.')
    } catch (reason: unknown) {
      setVerificationError(reason instanceof Error ? reason.message : 'Email verification failed. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  async function resendVerificationCode() {
    setVerificationError('')
    setIsResending(true)
    try {
      await onResendEmailVerification(email)
      setVerificationCode('')
      setVerificationNotice('If this address belongs to an unverified resident account, a code will be sent.')
    } catch (reason: unknown) {
      setVerificationError(reason instanceof Error ? reason.message : 'Could not request a verification code.')
    } finally {
      setIsResending(false)
    }
  }

  function closeVerificationModal() {
    setVerificationModalOpen(false)
    setVerificationNotice('')
    setVerificationError('')
  }

  return (
    <div className={`auth-layout register-layout${modal ? ' auth-modal-form' : ''}`}>
      <aside className="auth-story">
        <Brand auth />
        <div className="auth-story-copy">
          <span className="eyebrow">YOUR NEIGHBORHOOD, YOUR VOICE</span>
          <h1>Help make<br />things <em>better.</em></h1>
          <p>Every report is a step toward a stronger community.</p>
        </div>
        <div className="auth-story-bottom">
          <span>Built for the people who call this municipality home.</span>
          <span>Baco, Oriental Mindoro · Est. 2024</span>
        </div>
      </aside>
      <main className="auth-main">
        <div className="auth-card register-card">
          <button className="back-link" onClick={onBack}>
            <ArrowLeft size={15} /> Back to sign in
          </button>
          <span className="auth-step"><ShieldCheck size={15} /> CREATE YOUR ACCOUNT</span>
          <h2>Join your community.</h2>
          <p className="auth-lead">Start reporting issues and track progress in your neighborhood.</p>
          
          {error && (
            <div className="auth-feedback auth-feedback-error">
              {error}
            </div>
          )}

          <form onSubmit={submit}>
            <label className="field-label">
              Full name
              <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
            </label>
            <label className="field-label">
              Email address
              <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </label>
            <label className="field-label">
              Phone number
              <input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09XXXXXXXXX" />
            </label>
            <label className="field-label">
              Password
              <input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
            </label>
            <label className="field-label">
              Confirm password
              <input required minLength={8} type="password" autoComplete="new-password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} placeholder="Re-enter password" />
            </label>
            <button className="button button-primary auth-submit" type="submit" disabled={isRegistering}>
              {isRegistering ? 'Creating account...' : 'Create account'} <ArrowRight size={16} />
            </button>
            <label className="auth-terms">
              <input type="checkbox" required checked={acceptedTerms} onChange={(event) => onAcceptedTermsChange(event.target.checked)} />
              <span>I agree to the <button type="button" className="legal-link" onClick={() => onOpenLegal('terms')}>Terms and Conditions</button> and <button type="button" className="legal-link" onClick={() => onOpenLegal('privacy')}>Privacy Policy</button>.</span>
            </label>
          </form>
          <div className="auth-divider"><span>Or sign up with</span></div>
          <GoogleSignInButton
            intent="sign_up"
            onCredential={async (idToken, intent) => {
              if (!acceptedTerms) {
                onRequireGoogleSignupConsent(idToken)
                return
              }
              await onGoogleSignIn(idToken, intent)
            }}
          />
        </div>
        <span className="auth-help">Already have an account? <a href="#login" onClick={onBack}>Sign in</a></span>
      </main>
      {verificationModalOpen && createPortal(<div className="account-action-backdrop" role="presentation" onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeVerificationModal()
      }}>
        <section className="account-action-dialog auth-light-dialog" role="dialog" aria-modal="true" aria-labelledby="email-verification-title">
          <header>
            <h2 id="email-verification-title">Verify your email</h2>
            <button className="account-action-close" type="button" aria-label="Close dialog" onClick={closeVerificationModal}><X size={18} /></button>
          </header>
          {verificationComplete ? <>
            <p>Your email address has been verified. Opening your dashboard...</p>
            <div className="auth-action-note" role="status">{verificationNotice}</div>
          </> : <>
            <p>Enter the 6-digit code for <strong>{email}</strong>.</p>
            {verificationNotice && <div className="auth-action-note" role="status">{verificationNotice}</div>}
            {verificationError && <p className="account-menu-message is-error" role="alert">{verificationError}</p>}
            <form className="account-action-form" onSubmit={verifyCode}>
              <label>
                Verification code
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={isVerifying}
                />
              </label>
              <button className="subtle-link" type="button" onClick={() => void resendVerificationCode()} disabled={isResending || isVerifying}>
                {isResending ? 'Requesting a new code...' : 'Resend code'}
              </button>
              <div className="account-action-buttons">
                <button className="account-action-secondary" type="button" onClick={closeVerificationModal} disabled={isVerifying}>Back to sign up</button>
                <button className="account-action-primary" type="submit" disabled={verificationCode.length !== 6 || isVerifying}>
                  {isVerifying ? 'Verifying...' : 'Verify email'}
                </button>
              </div>
            </form>
          </>}
        </section>
      </div>, document.body)}
    </div>
  )
}
