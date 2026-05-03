import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

function Section({ title, children }) {
  return (
    <div className="card" style={{ maxWidth: 520, marginBottom: 20 }}>
      <h3 style={{ fontSize: 24, marginBottom: 20 }}>{title}</h3>
      {children}
    </div>
  );
}

export default function AccountSettings({ session }) {
  const navigate = useNavigate();

  const [emailForm, setEmailForm] = useState({ email: session?.user?.email || '', password: '' });
  const [emailMsg, setEmailMsg] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  async function handleChangeEmail(e) {
    e.preventDefault();
    setEmailErr(''); setEmailMsg('');
    if (!emailForm.email.trim()) { setEmailErr('Email is required.'); return; }
    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser({ email: emailForm.email.trim() });
    if (error) setEmailErr(error.message);
    else setEmailMsg('Confirmation sent to your new email address.');
    setEmailLoading(false);
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwErr(''); setPwMsg('');
    if (pwForm.next.length < 6) { setPwErr('New password must be at least 6 characters.'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwErr('Passwords do not match.'); return; }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.next });
    if (error) setPwErr(error.message);
    else {
      setPwMsg('Password updated successfully.');
      setPwForm({ current: '', next: '', confirm: '' });
    }
    setPwLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/auth');
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Account</h1>
      </div>

      <Section title="Email Address">
        {emailErr && <div className="error-msg">{emailErr}</div>}
        {emailMsg && <div className="success-msg">{emailMsg}</div>}
        <form onSubmit={handleChangeEmail}>
          <div className="form-group">
            <label>Current Email</label>
            <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 14, color: 'var(--olive-light)', padding: '8px 0' }}>
              {session?.user?.email}
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label>New Email</label>
            <input
              type="email"
              value={emailForm.email}
              onChange={e => setEmailForm(f => ({ ...f, email: e.target.value }))}
              placeholder="new@example.com"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={emailLoading}>
            {emailLoading ? 'Updating...' : 'Update Email'}
          </button>
        </form>
      </Section>

      <Section title="Change Password">
        {pwErr && <div className="error-msg">{pwErr}</div>}
        {pwMsg && <div className="success-msg">{pwMsg}</div>}
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={pwForm.next}
              onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
              placeholder="••••••••"
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label>Confirm New Password</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={pwLoading}>
            {pwLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </Section>

      <Section title="Sign Out">
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
          You are signed in as <strong style={{ color: 'var(--white)' }}>{session?.user?.email}</strong>.
        </p>
        <button className="btn-danger" onClick={handleSignOut}>
          Sign Out
        </button>
      </Section>
    </div>
  );
}
