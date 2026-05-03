import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

const navStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 100,
  background: 'var(--bg-secondary)',
  borderBottom: '1px solid var(--border)',
  boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
};

const innerStyle = {
  maxWidth: 1100,
  margin: '0 auto',
  padding: '0 20px',
  display: 'flex',
  alignItems: 'center',
  gap: 0,
  height: 56,
};

const logoStyle = {
  fontFamily: 'Bebas Neue, sans-serif',
  fontSize: 26,
  letterSpacing: '0.08em',
  color: 'var(--text-primary)',
  marginRight: 36,
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexShrink: 0,
};

const logoAccent = {
  color: 'var(--tan)',
};

const linkListStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  flex: 1,
  listStyle: 'none',
};

function NavItem({ to, children }) {
  return (
    <li>
      <NavLink
        to={to}
        style={({ isActive }) => ({
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 600,
          fontSize: 15,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: isActive ? 'var(--tan)' : 'var(--olive-light)',
          textDecoration: 'none',
          padding: '6px 14px',
          borderRadius: 'var(--radius-sm)',
          background: isActive ? 'var(--bg-tertiary)' : 'transparent',
          display: 'block',
          transition: 'color 0.15s, background 0.15s',
        })}
      >
        {children}
      </NavLink>
    </li>
  );
}

export default function Nav({ session }) {
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/auth');
  }

  return (
    <nav style={navStyle}>
      <div style={innerStyle}>
        <NavLink to="/dashboard" style={logoStyle}>
          PACKOUT<span style={logoAccent}>GEAR</span>
        </NavLink>

        <ul style={linkListStyle}>
          <NavItem to="/dashboard">Dashboard</NavItem>
          <NavItem to="/gear">Gear Vault</NavItem>
          <NavItem to="/hunts">Hunts</NavItem>
          <NavItem to="/account">Account</NavItem>
        </ul>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 12, color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session?.user?.email}
          </span>
          <button
            className="btn-ghost"
            onClick={handleSignOut}
            style={{ flexShrink: 0, fontSize: 12, padding: '5px 12px' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
