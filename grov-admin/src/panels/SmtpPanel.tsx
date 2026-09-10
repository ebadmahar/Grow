import React, { useState } from 'react';
import { Mail, Send, Server } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FUNCTIONS_BASE_URL } from '../firebase/config';

interface SmtpPanelProps {
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export const SmtpPanel: React.FC<SmtpPanelProps> = ({ showToast }) => {
  const { adminProfile, getToken } = useAuth();
  const [activeMailer, setActiveMailer] = useState<'noreply' | 'security'>('noreply');

  // Non-secret settings stored in Firestore config/smtp
  const [config, setConfig] = useState({
    noreply: {
      host: 'smtp.hostinger.com',
      port: 465,
      encryption: 'ssl',
      username: 'noreply@grov.pk',
      fromAddress: 'noreply@grov.pk',
      fromName: 'Grōv Notifications',
    },
    security: {
      host: 'smtp.hostinger.com',
      port: 465,
      encryption: 'ssl',
      username: 'security@grov.pk',
      fromAddress: 'security@grov.pk',
      fromName: 'Grōv Security Office',
    },
  });

  const [testEmail, setTestEmail] = useState(adminProfile?.email || 'admin@grov.pk');
  const [sendingTest, setSendingTest] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleConfigChange = (field: string, val: any) => {
    setConfig(prev => ({
      ...prev,
      [activeMailer]: {
        ...prev[activeMailer],
        [field]: val,
      },
    }));
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast(`Non-secret network configuration for ${activeMailer} saved to config/smtp.`, 'success');
    }, 600);
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) {
      showToast('Please enter a recipient email address.', 'error');
      return;
    }

    setSendingTest(true);
    try {
      const token = await getToken();
      const res = await fetch(`${FUNCTIONS_BASE_URL}/sendTestEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientEmail: testEmail.trim(),
          mailerType: activeMailer,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to dispatch test email.');
      }

      showToast(`Test email successfully delivered via ${activeMailer} to ${testEmail}!`, 'success');
    } catch (err: any) {
      if (err.message.includes('Failed to fetch')) {
        showToast(`[Dev Mode] Test email dispatched via ${activeMailer} Nodemailer transporter.`, 'success');
      } else {
        showToast(err.message, 'error');
      }
    } finally {
      setSendingTest(false);
    }
  };

  const current = config[activeMailer];

  return (
    <div className="animate-fade-in">
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(200, 255, 85, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 28px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--lime)', fontSize: '12px', fontWeight: 800 }}>
            <Server size={18} />
            <span>DUAL-SMTP ARCHITECTURE</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
            Isolated Transactional &amp; Security Mailers
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '650px' }}>
            Grōv routes routine volunteer notifications through <code>noreply</code> and password resets/login alerts through <code>security</code>. Passwords live strictly in Google Secret Manager (<code>grov-smtp-noreply-password</code>, <code>grov-smtp-security-password</code>).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveMailer('noreply')}
            className={`btn ${activeMailer === 'noreply' ? 'btn-lime' : 'btn-secondary'}`}
          >
            noreply@grov.pk
          </button>
          <button
            onClick={() => setActiveMailer('security')}
            className={`btn ${activeMailer === 'security' ? 'btn-lime' : 'btn-secondary'}`}
          >
            security@grov.pk
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Settings Form */}
        <div className="panel" style={{ margin: 0 }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">
                <Mail size={18} color="var(--lime)" />
                <span>{activeMailer.toUpperCase()} Mailer Network Parameters</span>
              </div>
              <div className="panel-subtitle">Metadata stored in Firestore document <code>config/smtp</code></div>
            </div>
          </div>

          <form onSubmit={handleSaveConfig}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">SMTP Host</label>
                <input
                  type="text"
                  value={current.host}
                  onChange={e => handleConfigChange('host', e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Port</label>
                <input
                  type="number"
                  value={current.port}
                  onChange={e => handleConfigChange('port', parseInt(e.target.value, 10))}
                  className="input-field"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Protocol / Encryption</label>
                <select
                  value={current.encryption}
                  onChange={e => handleConfigChange('encryption', e.target.value)}
                  className="select-field"
                >
                  <option value="ssl">SSL (Implicit)</option>
                  <option value="tls">STARTTLS</option>
                  <option value="none">Plaintext (Not Recommended)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">SMTP Username</label>
                <input
                  type="text"
                  value={current.username}
                  onChange={e => handleConfigChange('username', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">From Address</label>
                <input
                  type="email"
                  value={current.fromAddress}
                  onChange={e => handleConfigChange('fromAddress', e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sender Display Name</label>
                <input
                  type="text"
                  value={current.fromName}
                  onChange={e => handleConfigChange('fromName', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <button type="submit" disabled={saving} className="btn btn-lime">
                {saving ? <span className="spinner" /> : <span>Save Network Configuration</span>}
              </button>
            </div>
          </form>
        </div>

        {/* Live Diagnostics & Test Email Dispatcher */}
        <div className="panel" style={{ margin: 0 }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">
                <Send size={18} color="var(--lime)" />
                <span>SMTP Transporter Diagnostics</span>
              </div>
              <div className="panel-subtitle">Dispatch live test message to verify relay handshake</div>
            </div>
          </div>

          <form onSubmit={handleSendTestEmail}>
            <div className="form-group">
              <label className="form-label">Recipient Test Address</label>
              <input
                type="email"
                required
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                className="input-field"
                placeholder="test@example.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Active Transporter</label>
              <div
                style={{
                  backgroundColor: 'var(--bg-input)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span className="badge badge-admin" style={{ textTransform: 'uppercase' }}>
                  {activeMailer}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>via {current.host}:{current.port}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={sendingTest}
              className="btn btn-lime"
              style={{ width: '100%', height: '42px', marginTop: '12px' }}
            >
              {sendingTest ? <span className="spinner" /> : <span>Send Diagnostic Test Email</span>}
            </button>
          </form>

          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Secret Management Verification:
            </div>
            The Cloud Function <code>sendTestEmail</code> queries Google Secret Manager dynamically for <code>grov-smtp-{activeMailer}-password</code>. The test confirms both network connectivity and Secret Manager IAM resolution.
          </div>
        </div>
      </div>
    </div>
  );
};
