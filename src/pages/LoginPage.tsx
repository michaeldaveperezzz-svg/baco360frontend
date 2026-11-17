import { useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck, X } from 'lucide-react'
import Brand from '../components/Brand'
import GoogleSignInButton from '../components/GoogleSignInButton'
import { useCodeCountdown, formatCodeCountdown } from '../hooks/useCodeCountdown'
import type { CodeTiming, GoogleSignInResult } from '../services/auth.service'

interface Props { 
  onLogin: (email: string, password: string, remember: boolean, reactivate?: boolean) => void | Promise<void>
  onRegister: () => void 
  onResendEmailVerification: (email: string) => Promise<CodeTiming>
  onRequestPasswordReset: (email: string) => Promise<CodeTiming>
  onVerifyPasswordResetCode: (email: string, code: string) => Promise<void>
  onResetPassword: (email: string, code: string, password: string, passwordConfirmation: string) => Promise<void>
  onGoogleSignIn: (idToken: string, intent: 'sign_in' | 'sign_up' | 'reactivate') => Promise<GoogleSignInResult>
  modal: true
}

const reactivationRequiredMessage = 'This account is deactivated. Confirm reactivation to continue.'
const emailVerificationRequiredMessage = 'Please verify your email address before signing in.'

function getErrorMessage(reason: unknown): string | null {
  if (reason instanceof Error) return reason.message
  if (reason && typeof reason === 'object' && 'message' in reason && typeof reason.message === 'string') {
    return reason.message
  }
  return null
}

export default function LoginPage({ onLogin, onRegister, onResendEmailVerification, onRequestPasswordReset, onVerifyPasswordResetCode, onResetPassword, onGoogleSignIn, modal }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [credentialsEditable, setCredentialsEditable] = useState(false)
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false)
  const [verificationRequestNotice, setVerificationRequestNotice] = useState('')
  const [verificationRequestError, setVerificationRequestError] = useState('')
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  const [resetCodeModalOpen, setResetCodeModalOpen] = useState(false)
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false)
  const [passwordResetCompleteOpen, setPasswordResetCompleteOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotCode, setForgotCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [forgotNotice, setForgotNotice] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [resetCodeFeedback, setResetCodeFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const [isForgotLoading, setIsForgotLoading] = useState(false)
  const [accountReactivation, setAccountReactivation] = useState(false)
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null)
  const [reactivationError, setReactivationError] = useState<string | null>(null)
  const codeCountdown = useCodeCountdown()
  const verificationCountdown = useCodeCountdown()
  
  async function submit(event: FormEvent<HTMLFormElement>) { 
    event.preventDefault()
    setError(null)
    setNeedsEmailVerification(false)
    setVerificationRequestNotice('')
    setVerificationRequestError('')
    setIsLoading(true)
    try {
      await onLogin(email, password, remember)
    } catch (err: unknown) {
      const message = getErrorMessage(err)
      if (message === reactivationRequiredMessage) {
        setAccountReactivation(true)
        setReactivationError(null)
      } else {
        setError(message || 'Login failed. Please check your credentials.')
        setNeedsEmailVerification(message === emailVerificationRequiredMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleCredential(idToken: string, intent: 'sign_in' | 'sign_up') {
    try {
      await onGoogleSignIn(idToken, intent)
    } catch (reason) {
      if (getErrorMessage(reason) === reactivationRequiredMessage) {
        setPendingGoogleToken(idToken)
        setAccountReactivation(true)
        setReactivationError(null)
        return
      }
      throw reason
    }
  }

  async function confirmReactivation() {
    setIsLoading(true)
    setReactivationError(null)
    try {
      if (pendingGoogleToken) {
        await onGoogleSignIn(pendingGoogleToken, 'reactivate')
      } else {
        await onLogin(email, password, remember, true)
      }
      setAccountReactivation(false)
      setPendingGoogleToken(null)
    } catch (reason) {
      setReactivationError(getErrorMessage(reason) || 'Unable to reactivate the account.')
    } finally {
      setIsLoading(false)
    }
  }

  function cancelReactivation() {
    setAccountReactivation(false)
    setPendingGoogleToken(null)
    setReactivationError(null)
    setPassword('')
  }

  function openForgotPassword() {
    codeCountdown.reset()
    setForgotEmail(email)
    setForgotCode('')
    setNewPassword('')
    setConfirmNewPassword('')
    setForgotNotice('')
    setForgotError('')
    setResetCodeFeedback(null)
    setResetCodeModalOpen(false)
    setChangePasswordModalOpen(false)
    setPasswordResetCompleteOpen(false)
    setForgotPasswordOpen(true)
  }

  function closeForgotPassword() {
    codeCountdown.reset()
    setForgotPasswordOpen(false)
    setResetCodeModalOpen(false)
    setChangePasswordModalOpen(false)
    setPasswordResetCompleteOpen(false)
    setForgotNotice('')
    setForgotError('')
    setResetCodeFeedback(null)
  }

  async function requestPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setForgotError('')
    setIsForgotLoading(true)
    try {
      const timing = await onRequestPasswordReset(forgotEmail)
      codeCountdown.start(timing)
      setForgotPasswordOpen(false)
      setResetCodeModalOpen(true)
      setForgotNotice('If an account exists for that email, a reset code will be sent. Check your inbox and spam folder.')
    } catch (reason: unknown) {
      setForgotError(getErrorMessage(reason) || 'Could not request a password reset.')
    } finally {
      setIsForgotLoading(false)
    }
  }

  async function resendPasswordResetCode() {
    setForgotError('')
    setIsForgotLoading(true)
    try {
      const timing = await onRequestPasswordReset(forgotEmail)
      codeCountdown.start(timing)
      setForgotCode('')
      setForgotNotice('If an account exists for that email, a reset code will be sent.')
    } catch (reason: unknown) {
      setForgotError(getErrorMessage(reason) || 'Could not request a password reset.')
    } finally {
      setIsForgotLoading(false)
    }
  }

  async function verifyResetCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setForgotError('')
    setIsForgotLoading(true)
    try {
      await onVerifyPasswordResetCode(forgotEmail, forgotCode)
      setResetCodeModalOpen(false)
      setResetCodeFeedback({ type: 'success', message: 'Your reset code is verified. Continue to create a new password.' })
      setForgotNotice('')
    } catch (reason: unknown) {
      setResetCodeFeedback({
        type: 'error',
        message: getErrorMessage(reason) || 'The reset code is invalid or expired. Request a new code and try again.',
      })
    } finally {
      setIsForgotLoading(false)
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (newPassword !== confirmNewPassword) {
      setForgotError('The passwords do not match.')
      return
    }
    setForgotError('')
    setIsForgotLoading(true)
    try {
      await onResetPassword(forgotEmail, forgotCode, newPassword, confirmNewPassword)
      setChangePasswordModalOpen(false)
      setPasswordResetCompleteOpen(true)
      setForgotNotice('Password reset successfully. You can now sign in.')
    } catch (reason: unknown) {
      setForgotError(getErrorMessage(reason) || 'Password reset failed. Please try again.')
    } finally {
      setIsForgotLoading(false)
    }
  }

  async function resendVerificationCode() {
    setVerificationRequestNotice('')
    setVerificationRequestError('')
    setIsLoading(true)
    try {
      const timing = await onResendEmailVerification(email)
      verificationCountdown.start(timing)
      setVerificationRequestNotice('If this address belongs to an unverified resident account, a code will be sent.')
    } catch (reason: unknown) {
      setVerificationRequestError(getErrorMessage(reason) || 'Could not request a verification code.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`auth-layout login-layout${modal ? ' auth-modal-form' : ''}`}>
      <aside className="auth-story">
        <Brand auth />
        <div className="auth-story-copy">
          <span className="eyebrow">A COMMUNITY THAT LISTENS</span>
          <h1>Better places<br />start with <em>us.</em></h1>
          <p>One simple way to make your neighborhood a little better, together.</p>
        </div>
        <div className="auth-story-bottom">
          <span>Built for the people who call this municipality home.</span>
          <span>Baco, Oriental Mindoro · Est. 2024</span>
        </div>
      </aside>
      <main className="auth-main">
        <div className="auth-card">
          <span className="auth-step"><ShieldCheck size={15} /> RESIDENT PORTAL</span>
          <h2>Welcome back.</h2>
          <p className="auth-lead">Sign in to follow up on your reports and community updates.</p>
          {error && (
            <div className="auth-feedback auth-feedback-error">
              {error}
              {needsEmailVerification && <button className="subtle-link" type="button" onClick={() => void resendVerificationCode()} disabled={isLoading || (verificationCountdown.resendInSeconds !== null && verificationCountdown.resendInSeconds > 0)}>
                {isLoading ? 'Requesting code...' : verificationCountdown.resendInSeconds
                  ? `Resend verification code in ${formatCodeCountdown(verificationCountdown.resendInSeconds)}`
                  : 'Resend verification code'}
              </button>}
            </div>
          )}
          {verificationRequestNotice && <div className="auth-action-note" role="status">{verificationRequestNotice}</div>}
          {verificationRequestError && <p className="account-menu-message is-error" role="alert">{verificationRequestError}</p>}
          <form onSubmit={submit} autoComplete="new-password">
            <label className="field-label">
              Email address
              <input 
                required 
                type="email" 
                autoComplete="new-password"
                readOnly={!credentialsEditable}
                onFocus={() => setCredentialsEditable(true)}
                value={email} 
                onChange={(event) => setEmail(event.target.value)} 
                placeholder="you@example.com" 
                disabled={isLoading}
              />
            </label>
            <label className="field-label">
              Password
              <div className="password-field">
                <input 
                  required 
                  minLength={6} 
                  type={showPassword ? 'text' : 'password'} 
                  autoComplete="new-password"
                  readOnly={!credentialsEditable}
                  onFocus={() => setCredentialsEditable(true)}
                  value={password} 
                  onChange={(event) => setPassword(event.target.value)} 
                  placeholder="Enter your password" 
                  disabled={isLoading}
                />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
            <div className="auth-form-options">
              <label>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} disabled={isLoading} /> Remember me
              </label>
              <button className="subtle-link" type="button" onClick={openForgotPassword} disabled={isLoading}>Forgot password?</button>
            </div>
            <button className="button button-primary auth-submit" type="submit" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Continue'} <ArrowRight size={16} />
            </button>
          </form>
          <div className="auth-divider"><span>Or continue with</span></div>
          <GoogleSignInButton intent="sign_in" onCredential={handleGoogleCredential} />
          <div className="auth-divider"><span>New to Baco360?</span></div>
          <button className="button button-secondary auth-register" type="button" onClick={onRegister} disabled={isLoading}>Create an account</button>
        </div>
      </main>
      {accountReactivation && <div className="account-action-backdrop">
        <section className="account-action-dialog auth-light-dialog" role="dialog" aria-modal="true" aria-labelledby="reactivate-account-title">
          <header><h2 id="reactivate-account-title">Reactivate account?</h2></header>
          <p>{pendingGoogleToken
            ? 'Your Google account is verified. Confirm to restore access to your Baco360 account.'
            : 'Your sign-in is verified. Confirm to restore access to your Baco360 account.'}</p>
          {reactivationError && <p className="account-menu-message is-error" role="alert">{reactivationError}</p>}
          <div className="account-action-buttons">
            <button type="button" className="account-action-secondary" onClick={cancelReactivation} disabled={isLoading}>Cancel</button>
            <button type="button" className="account-action-primary" onClick={() => void confirmReactivation()} disabled={isLoading}>
              {isLoading ? 'Reactivating…' : 'Confirm and sign in'}
            </button>
          </div>
        </section>
      </div>}
      {(forgotPasswordOpen || resetCodeModalOpen || resetCodeFeedback || changePasswordModalOpen || passwordResetCompleteOpen) && createPortal(<div className="account-action-backdrop" role="presentation" onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeForgotPassword()
      }}>
        {forgotPasswordOpen && <section className="account-action-dialog auth-light-dialog" role="dialog" aria-modal="true" aria-labelledby="forgot-password-title">
          <header>
            <div className="auth-dialog-heading">
              <span className="auth-dialog-icon"><Mail size={18} /></span>
              <div><h2 id="forgot-password-title">Forgot password?</h2></div>
            </div>
            <button className="account-action-close" type="button" aria-label="Close dialog" onClick={closeForgotPassword}><X size={18} /></button>
          </header>
          <p>Enter the email address linked to your account. We’ll send a reset code if the account is eligible.</p>
          {forgotError && <p className="account-menu-message is-error" role="alert">{forgotError}</p>}
          <form className="account-action-form" onSubmit={requestPasswordReset}>
            <label>
              Email address
              <input type="email" autoComplete="email" required value={forgotEmail} onChange={(event) => setForgotEmail(event.target.value)} disabled={isForgotLoading} />
            </label>
            <div className="account-action-buttons">
              <button className="account-action-secondary" type="button" onClick={closeForgotPassword} disabled={isForgotLoading}>Cancel</button>
              <button className="account-action-primary" type="submit" disabled={isForgotLoading}>{isForgotLoading ? 'Requesting code...' : 'Send reset code'}</button>
            </div>
          </form>
        </section>}
        {resetCodeModalOpen && !resetCodeFeedback && <section className="account-action-dialog auth-light-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-code-title">
          <header>
            <div className="auth-dialog-heading">
              <span className="auth-dialog-icon"><KeyRound size={18} /></span>
              <div><h2 id="reset-code-title">Enter reset code</h2></div>
            </div>
            <button className="account-action-close" type="button" aria-label="Close dialog" onClick={closeForgotPassword}><X size={18} /></button>
          </header>
          <p>Enter the 6-digit code sent to <strong>{forgotEmail}</strong>.</p>
          {forgotNotice && <div className="auth-action-note" role="status">{forgotNotice}</div>}
          {forgotError && <p className="account-menu-message is-error" role="alert">{forgotError}</p>}
          <form className="account-action-form" onSubmit={verifyResetCode}>
            <label>
              Verification code
              <input
                className="auth-code-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={forgotCode}
                onChange={(event) => setForgotCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={isForgotLoading}
              />
            </label>
            <button className="subtle-link" type="button" onClick={() => void resendPasswordResetCode()} disabled={isForgotLoading || (codeCountdown.resendInSeconds !== null && codeCountdown.resendInSeconds > 0)}>
              {isForgotLoading ? 'Requesting code...' : codeCountdown.resendInSeconds
                ? `Resend reset code in ${formatCodeCountdown(codeCountdown.resendInSeconds)}`
                : 'Resend reset code'}
            </button>
            <div className="account-action-buttons">
              <button className="account-action-secondary" type="button" onClick={() => {
                setResetCodeModalOpen(false)
                setForgotPasswordOpen(true)
                setForgotCode('')
                setForgotNotice('')
                setForgotError('')
              }} disabled={isForgotLoading}>Back</button>
              <button className="account-action-primary" type="submit" disabled={isForgotLoading || forgotCode.length !== 6}>{isForgotLoading ? 'Checking code...' : 'Continue'}</button>
            </div>
          </form>
        </section>}
        {resetCodeFeedback && <section className="account-action-dialog auth-light-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-code-feedback-title">
          <header>
            <div className="auth-dialog-heading">
              <span className={`auth-dialog-icon${resetCodeFeedback.type === 'success' ? ' is-success' : ' is-error'}`}>
                {resetCodeFeedback.type === 'success' ? <ShieldCheck size={18} /> : <KeyRound size={18} />}
              </span>
              <div><h2 id="reset-code-feedback-title">{resetCodeFeedback.type === 'success' ? 'Code verified' : 'Code not accepted'}</h2></div>
            </div>
            <button className="account-action-close" type="button" aria-label="Close dialog" onClick={closeForgotPassword}><X size={18} /></button>
          </header>
          <p role={resetCodeFeedback.type === 'error' ? 'alert' : 'status'}>{resetCodeFeedback.message}</p>
          <div className="account-action-buttons">
            {resetCodeFeedback.type === 'success'
              ? <button className="account-action-primary" type="button" onClick={() => {
                setResetCodeFeedback(null)
                setChangePasswordModalOpen(true)
              }}>Continue</button>
              : <button className="account-action-secondary" type="button" onClick={() => setResetCodeFeedback(null)}>Try again</button>}
          </div>
        </section>}
        {changePasswordModalOpen && <section className="account-action-dialog auth-light-dialog" role="dialog" aria-modal="true" aria-labelledby="change-password-title">
          <header>
            <div className="auth-dialog-heading">
              <span className="auth-dialog-icon"><LockKeyhole size={18} /></span>
              <div><h2 id="change-password-title">Create a new password</h2></div>
            </div>
            <button className="account-action-close" type="button" aria-label="Close dialog" onClick={closeForgotPassword}><X size={18} /></button>
          </header>
          <p>Choose a new password for <strong>{forgotEmail}</strong>.</p>
          {forgotError && <p className="account-menu-message is-error" role="alert">{forgotError}</p>}
          <form className="account-action-form" onSubmit={resetPassword}>
            <label>
              New password
              <input type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} disabled={isForgotLoading} />
            </label>
            <label>
              Confirm new password
              <input type="password" autoComplete="new-password" minLength={8} required value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} disabled={isForgotLoading} />
            </label>
            <div className="account-action-buttons">
              <button className="account-action-secondary" type="button" onClick={() => {
                setChangePasswordModalOpen(false)
                setResetCodeModalOpen(true)
                setForgotError('')
              }} disabled={isForgotLoading}>Back to code</button>
              <button className="account-action-primary" type="submit" disabled={isForgotLoading}>{isForgotLoading ? 'Updating password...' : 'Change password'}</button>
            </div>
          </form>
        </section>}
        {passwordResetCompleteOpen && <section className="account-action-dialog auth-light-dialog" role="dialog" aria-modal="true" aria-labelledby="password-reset-complete-title">
          <header>
            <div className="auth-dialog-heading">
              <span className="auth-dialog-icon is-success"><ShieldCheck size={18} /></span>
              <div><h2 id="password-reset-complete-title">Password changed</h2><small>All set</small></div>
            </div>
            <button className="account-action-close" type="button" aria-label="Close dialog" onClick={closeForgotPassword}><X size={18} /></button>
          </header>
          <p role="status">{forgotNotice}</p>
          <div className="account-action-buttons">
            <button className="account-action-primary" type="button" onClick={() => {
              setEmail(forgotEmail)
              setPassword('')
              setCredentialsEditable(true)
              closeForgotPassword()
            }}>Continue to sign in</button>
          </div>
        </section>}
      </div>, document.body)}
    </div>
  )
}
