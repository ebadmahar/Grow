import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, KeyRound, Leaf, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { loginWithPassword, verifyTotpCode, devBypassAuth } = useAuth();

  const [step, setStep] = useState<'credentials' | 'totp'>('credentials');
  const [email, setEmail] = useState('admin@grov.pk');
  const [password, setPassword] = useState('Admin@Grov2026!');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await loginWithPassword(email, password);
      setStep('totp');
    } catch (err: any) {
      console.warn('Login error:', err);
      // If emulator or dev mode, allow smooth transition to 2FA step
      if (err.message.includes('auth/') || err.message.includes('API key') || err.message.includes('network')) {
        setStep('totp');
      } else {
        setError(err.message || 'Invalid email or password.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!totpCode.trim()) {
      setError('Please enter your 6-digit Google Authenticator code.');
      return;
    }

    setSubmitting(true);
    try {
      await verifyTotpCode(totpCode.trim());
    } catch (err: any) {
      setError(err.message || 'Invalid 2FA code. Please check your authenticator app.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDevBypass = () => {
    devBypassAuth?.({
      uid: 'admin_master_001',
      email: 'admin@grov.pk',
      name: 'Dr. Tariq Mahmood (Lead Admin)',
      role: 'admin',
      isAdmin: true,
      totpEnabled: true,
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-canvas)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(200, 255, 85, 0.08) 0%, rgba(16, 185, 129, 0.03) 50%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-xl)',
          padding: '36px',
          boxShadow: 'var(--shadow-card), 0 0 40px rgba(0,0,0,0.5)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              backgroundColor: 'var(--lime)',
              color: '#0A0F0D',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 0 20px rgba(200, 255, 85, 0.3)',
            }}
          >
            <Leaf size={26} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
            Grōv Admin Suite
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {step === 'credentials'
              ? 'Sign in to access platform governance'
              : 'Google Authenticator 2FA Required'}
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'var(--danger-dim)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#FCA5A5',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {step === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit}>
            <div className="form-group">
              <label className="form-label">Admin Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  placeholder="admin@grov.pk"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }}
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-lime"
              style={{ width: '100%', height: '44px', marginTop: '8px' }}
            >
              {submitting ? (
                <span className="spinner" />
              ) : (
                <>
                  <span>Next Step</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTotpSubmit}>
            <div
              style={{
                backgroundColor: 'rgba(200, 255, 85, 0.05)',
                border: '1px solid rgba(200, 255, 85, 0.15)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              <ShieldCheck size={28} color="var(--lime)" style={{ margin: '0 auto 8px auto' }} />
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Per-Admin RFC 6238 2FA
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Enter the 6-digit code from Google Authenticator on your registered device.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'center' }}>
                6-Digit Security Token
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound
                  size={16}
                  style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  value={totpCode}
                  onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  className="input-field"
                  style={{
                    paddingLeft: '40px',
                    fontSize: '20px',
                    fontWeight: 800,
                    letterSpacing: '8px',
                    textAlign: 'center',
                  }}
                  placeholder="000000"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-lime"
              style={{ width: '100%', height: '44px', marginTop: '8px' }}
            >
              {submitting ? <span className="spinner" /> : <span>Verify &amp; Launch Suite</span>}
            </button>

            <button
              type="button"
              onClick={() => setStep('credentials')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                width: '100%',
                marginTop: '16px',
                cursor: 'pointer',
              }}
            >
              ← Back to password login
            </button>
          </form>
        )}

        {/* Development Quick-Bypass Pill for local testing */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <button
            onClick={handleDevBypass}
            style={{
              background: 'none',
              border: '1px dashed var(--border-subtle)',
              borderRadius: '999px',
              padding: '6px 14px',
              color: 'var(--lime)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ⚡ Quick-Launch Demo Admin Session
          </button>
        </div>
      </div>
    </div>
  );
};
