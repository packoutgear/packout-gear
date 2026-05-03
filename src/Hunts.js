import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

const HUNT_TYPES = [
  'Elk', 'Deer', 'Antelope', 'Bear', 'Mountain Goat', 'Bighorn Sheep',
  'Moose', 'Turkey', 'Waterfowl', 'Upland Bird', 'Predator', 'Other',
];

function ozToDisplay(oz) {
  if (oz == null) return null;
  if (oz < 16) return `${parseFloat(oz.toFixed(1))} oz`;
  const lbs = Math.floor(oz / 16);
  const rem = parseFloat((oz % 16).toFixed(1));
  return rem > 0 ? `${lbs} lb ${rem} oz` : `${lbs} lb`;
}

const emptyForm = { name: '', hunt_type: '', days: '', notes: '' };

function HuntModal({ hunt, onClose, onSave }) {
  const [form, setForm] = useState(hunt ? {
    name: hunt.name || '',
    hunt_type: hunt.hunt_type || '',
    days: hunt.days != null ? String(hunt.days) : '',
    notes: hunt.notes || '',
  } : { ...emptyForm });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field, val) { setForm(f => ({ ...f, [field]: val })); }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Hunt name is required.'); return; }
    setError('');
    setLoading(true);

    const payload = {
      name: form.name.trim(),
      hunt_type: form.hunt_type || null,
      days: form.days ? parseInt(form.days) : null,
      notes: form.notes.trim() || null,
    };

    onSave(payload, setError, setLoading);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{hunt ? 'Edit Hunt' : 'New Hunt'}</h2>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: 22 }}>✕</button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Hunt Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. 2024 Elk Archery" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Hunt Type</label>
              <select value={form.hunt_type} onChange={e => set('hunt_type', e.target.value)}>
                <option value="">— Select —</option>
                {HUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Days in Field</label>
              <input
                type="number"
                min="1"
                value={form.days}
                onChange={e => set('days', e.target.value)}
                placeholder="7"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Unit, elevation, access notes..."
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Hunt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Hunts({ session }) {
  const [hunts, setHunts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editHunt, setEditHunt] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadHunts = useCallback(async () => {
    const { data } = await supabase
      .from('hunts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    setHunts(data || []);
    setLoading(false);
  }, [session]);

  useEffect(() => { loadHunts(); }, [loadHunts]);

  async function handleSave(payload, setError, setModalLoading) {
    if (editHunt) {
      const { error } = await supabase
        .from('hunts')
        .update(payload)
        .eq('id', editHunt.id);
      if (error) { setError(error.message); setModalLoading(false); return; }
    } else {
      const { error } = await supabase
        .from('hunts')
        .insert({ ...payload, user_id: session.user.id, total_weight_oz: 0 });
      if (error) { setError(error.message); setModalLoading(false); return; }
    }
    setModalOpen(false);
    setEditHunt(null);
    loadHunts();
  }

  async function handleDuplicate(hunt) {
    const { data: huntGear } = await supabase
      .from('hunt_gear')
      .select('gear_item_id, checked')
      .eq('hunt_id', hunt.id);

    const { data: newHunt, error } = await supabase
      .from('hunts')
      .insert({
        user_id: session.user.id,
        name: `${hunt.name} (Copy)`,
        hunt_type: hunt.hunt_type,
        days: hunt.days,
        notes: hunt.notes,
        total_weight_oz: hunt.total_weight_oz,
      })
      .select()
      .single();

    if (error || !newHunt) return;

    if (huntGear && huntGear.length > 0) {
      await supabase.from('hunt_gear').insert(
        huntGear.map(g => ({ hunt_id: newHunt.id, gear_item_id: g.gear_item_id, checked: false }))
      );
    }

    loadHunts();
  }

  async function handleDelete(hunt) {
    await supabase.from('hunt_gear').delete().eq('hunt_id', hunt.id);
    await supabase.from('hunts').delete().eq('id', hunt.id);
    setDeleteConfirm(null);
    loadHunts();
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Hunts</h1>
        <button className="btn-primary" onClick={() => { setEditHunt(null); setModalOpen(true); }}>
          + New Hunt
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--olive-light)', fontFamily: 'Barlow Condensed', letterSpacing: '0.06em' }}>LOADING...</div>
      ) : hunts.length === 0 ? (
        <div className="empty-state">
          <h3>No Hunts Yet</h3>
          <p style={{ marginBottom: 20 }}>Create your first hunt to start building a gear list.</p>
          <button className="btn-primary" onClick={() => { setEditHunt(null); setModalOpen(true); }}>
            Create Hunt
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hunts.map(hunt => (
            <div
              key={hunt.id}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--olive-dark)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link
                  to={`/hunts/${hunt.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontWeight: 700,
                    fontSize: 19,
                    color: 'var(--white)',
                    marginBottom: 6,
                  }}>
                    {hunt.name}
                  </div>
                </Link>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {hunt.hunt_type && <span className="tag">{hunt.hunt_type}</span>}
                  {hunt.days && <span className="tag">{hunt.days} days</span>}
                  {hunt.total_weight_oz != null && hunt.total_weight_oz > 0 && (
                    <span className="weight-badge">{ozToDisplay(hunt.total_weight_oz)}</span>
                  )}
                </div>
                {hunt.notes && (
                  <div style={{ marginTop: 6, fontSize: 13, color: 'var(--olive-light)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {hunt.notes}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                <Link to={`/hunts/${hunt.id}`}>
                  <button className="btn-ghost" style={{ fontSize: 12 }}>Open</button>
                </Link>
                <button className="btn-icon" onClick={() => { setEditHunt(hunt); setModalOpen(true); }} title="Edit">✎</button>
                <button className="btn-icon" onClick={() => handleDuplicate(hunt)} title="Duplicate" style={{ fontSize: 14 }}>⧉</button>
                <button className="btn-icon" onClick={() => setDeleteConfirm(hunt)} title="Delete" style={{ color: 'var(--danger)' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <HuntModal
          hunt={editHunt}
          onClose={() => { setModalOpen(false); setEditHunt(null); }}
          onSave={handleSave}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Hunt</h2>
              <button className="btn-icon" onClick={() => setDeleteConfirm(null)} style={{ fontSize: 22 }}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
              Delete <strong style={{ color: 'var(--white)' }}>{deleteConfirm.name}</strong>? All gear assignments will be removed.
            </p>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
