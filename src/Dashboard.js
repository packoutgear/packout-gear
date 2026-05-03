import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

function ozToDisplay(oz) {
  if (oz == null) return '—';
  if (oz < 16) return `${oz} oz`;
  const lbs = Math.floor(oz / 16);
  const rem = oz % 16;
  return rem > 0 ? `${lbs} lb ${rem} oz` : `${lbs} lb`;
}

export default function Dashboard({ session }) {
  const [gearCount, setGearCount] = useState(0);
  const [hunts, setHunts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const userId = session.user.id;

      const [{ count }, { data: huntData }] = await Promise.all([
        supabase
          .from('gear_items')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('hunts')
          .select('id, name, hunt_type, days, total_weight_oz, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      setGearCount(count || 0);
      setHunts(huntData || []);
      setLoading(false);
    }
    load();
  }, [session]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/gear">
            <button className="btn-secondary">+ Add Gear</button>
          </Link>
          <Link to="/hunts">
            <button className="btn-primary">+ New Hunt</button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--olive-light)', fontFamily: 'Barlow Condensed', letterSpacing: '0.06em' }}>LOADING...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 36 }}>
            <div className="stat-card">
              <div className="stat-value">{gearCount}</div>
              <div className="stat-label">Gear Items</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{hunts.length}</div>
              <div className="stat-label">Recent Hunts</div>
            </div>
            {hunts.length > 0 && (
              <div className="stat-card">
                <div className="stat-value" style={{ fontSize: 32 }}>
                  {ozToDisplay(hunts[0]?.total_weight_oz)}
                </div>
                <div className="stat-label">Latest Pack Weight</div>
              </div>
            )}
          </div>

          <div>
            <h2 style={{ fontSize: 28, marginBottom: 16 }}>Recent Hunts</h2>

            {hunts.length === 0 ? (
              <div className="empty-state">
                <h3>No Hunts Yet</h3>
                <p style={{ marginBottom: 20 }}>Start building your first hunt loadout.</p>
                <Link to="/hunts">
                  <button className="btn-primary">Create a Hunt</button>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {hunts.map(hunt => (
                  <Link
                    key={hunt.id}
                    to={`/hunts/${hunt.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      className="card"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        cursor: 'pointer',
                        transition: 'border-color 0.15s, background 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--olive-bright)';
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--olive-dark)';
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                        <div>
                          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 17, marginBottom: 2 }}>
                            {hunt.name}
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {hunt.hunt_type && <span className="tag">{hunt.hunt_type}</span>}
                            {hunt.days && <span className="tag">{hunt.days} days</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {hunt.total_weight_oz != null && (
                          <div className="weight-badge" style={{ fontSize: 16 }}>
                            {ozToDisplay(hunt.total_weight_oz)}
                          </div>
                        )}
                        <div style={{ color: 'var(--olive-light)', fontSize: 12, marginTop: 2 }}>
                          View →
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}

                {hunts.length >= 5 && (
                  <Link to="/hunts" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
                    <button className="btn-ghost" style={{ width: '100%' }}>View All Hunts</button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
