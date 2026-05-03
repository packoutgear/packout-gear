import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './App.css';

import Nav from './Nav';
import Auth from './Auth';
import Dashboard from './Dashboard';
import GearVault from './GearVault';
import Hunts from './Hunts';
import HuntDetail from './HuntDetail';
import AccountSettings from './AccountSettings';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
          LOADING...
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-layout">
        {session && <Nav session={session} />}
        <main className="app-content">
          <Routes>
            <Route
              path="/auth"
              element={session ? <Navigate to="/dashboard" replace /> : <Auth />}
            />
            <Route
              path="/dashboard"
              element={session ? <Dashboard session={session} /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/gear"
              element={session ? <GearVault session={session} /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/hunts"
              element={session ? <Hunts session={session} /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/hunts/:id"
              element={session ? <HuntDetail session={session} /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/account"
              element={session ? <AccountSettings session={session} /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="*"
              element={<Navigate to={session ? '/dashboard' : '/auth'} replace />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
