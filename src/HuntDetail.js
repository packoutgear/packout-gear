import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

const HUNT_TYPES = [
  'Elk', 'Deer', 'Antelope', 'Bear', 'Mountain Goat', 'Bighorn Sheep',
  'Moose', 'Turkey', 'Waterfowl', 'Upland Bird', 'Predator', 'Other',
];

function ozToDisplay(oz) {
  if (oz == null || oz === 0) return '0 oz';
  const lbs = Math.floor(oz / 16);
  const rem = parseFloat((oz % 16).toFixed(1));
  if (lbs === 0) return `${rem} oz`;
  return rem > 0 ? `${lbs} lb ${rem} oz` : `${lbs} lb`;
}

function EditHuntModal({ hunt, onClose, onSave }) {
  const [form, setForm] = useState({
    name: hunt.name || '',
    hunt_type: hunt.hunt_type || '',
    days: hunt.days != null ? String(hunt.days) : '',
    notes: hunt.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field, val) { setForm(f => ({ ...f, [field]: val })); }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Hunt name is required.'); return; }
    setError(''); setLoading(true);
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
          <h2>Edit Hunt</h2>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: 22 }}>✕</button>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Hunt Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} />
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
              <input type="number" min="1" value={form.days} onChange={e => set('days', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddGearModal({ huntId, existingIds, onClose, onAdd }) {
  const [allGear, setAllGear] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('gear_items')
        .select('*')
        .order('category')
        .order('name');
      setAllGear((data || []).filter(g => !existingIds.has(g.id)));
    }
    load();
  }, [existingIds]);

  const filtered = allGear.filter(g =>
    !search ||
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.brand || '').toLowerCase().includes(search.toLowerCase()) ||
    (g.category || '').toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id) {
    setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function handleAdd() {
    if (selected.size === 0) return;
    setLoading(true);
    const rows = Array.from(selected).map(gear_item_id => ({ hunt_id: huntId, gear_item_id, checked: false }));
    await supabase.from('hunt_gear').insert(rows);
    onAdd();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Gear to Hunt</h2>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: 22 }}>✕</button>
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search gear vault..."
          style={{ marginBottom: 14 }}
          autoFocus
        />

        {filtered.length === 0 ? (
          <div style={{ color: 'var(--olive-light)', textAlign: 'center', padding: '30px 0', fontSize: 14 }}>
            {allGear.length === 0 ? 'All gear is already added to this hunt.' : 'No matching gear found.'}
          </div>
        ) : (
          <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(g => (
              <label
                key={g.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  background: selected.has(g.id) ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                  border: `1px solid ${selected.has(g.id) ? 'var(--olive-bright)' : 'var(--olive-dark)'}`,
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'background 0.12s, border-color 0.12s',
                  width: 'auto',
                  marginBottom: 0,
                  textTransform: 'none',
                  letterSpacing: 'normal',
                  fontSize: '14px',
                  fontFamily: 'Barlow, sans-serif',
                  fontWeight: 400,
                  color: 'var(--white)',
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(g.id)}
                  onChange={() => toggle(g.id)}
                  style={{ width: 'auto', accentColor: 'var(--accent)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, fontSize: 15 }}>{g.name}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                    {g.brand && <span style={{ color: 'var(--olive-light)', fontSize: 12 }}>{g.brand}</span>}
                    {g.category && <span className="tag" style={{ fontSize: 10 }}>{g.category}</span>}
                  </div>
                </div>
                {g.weight_oz != null && (
                  <span className="weight-badge">{ozToDisplay(g.weight_oz)}</span>
                )}
              </label>
            ))}
          </div>
        )}

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleAdd}
            disabled={selected.size === 0 || loading}
          >
            {loading ? 'Adding...' : `Add ${selected.size > 0 ? selected.size : ''} Item${selected.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HuntDetail({ session }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hunt, setHunt] = useState(null);
  const [huntGear, setHuntGear] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [addGearOpen, setAddGearOpen] = useState(false);

  const loadAll = useCallback(async () => {
    const [{ data: huntData }, { data: gearData }] = await Promise.all([
      supabase.from('hunts').select('*').eq('id', id).single(),
      supabase
        .from('hunt_gear')
        .select('id, checked, gear_item_id, gear_items(id, name, brand, category, weight_oz, price, product_url, notes)')
        .eq('hunt_id', id),
    ]);

    if (!huntData) { navigate('/hunts'); return; }
    setHunt(huntData);
    setHuntGear(gearData || []);
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function recalcTotalWeight(gear) {
    const total = (gear || huntGear).reduce((sum, hg) => sum + (hg.gear_items?.weight_oz || 0), 0);
    await supabase.from('hunts').update({ total_weight_oz: total }).eq('id', id);
    setHunt(h => ({ ...h, total_weight_oz: total }));
    return total;
  }

  async function handleToggleChecked(hgId, current) {
    const updated = huntGear.map(hg => hg.id === hgId ? { ...hg, checked: !current } : hg);
    setHuntGear(updated);
    await supabase.from('hunt_gear').update({ checked: !current }).eq('id', hgId);
  }

  async function handleRemoveGear(hgId) {
    const updated = huntGear.filter(hg => hg.id !== hgId);
    setHuntGear(updated);
    await supabase.from('hunt_gear').delete().eq('id', hgId);
    await recalcTotalWeight(updated);
  }

  async function handleEditSave(payload, setError, setModalLoading) {
    const { error } = await supabase.from('hunts').update(payload).eq('id', id);
    if (error) { setError(error.message); setModalLoading(false); return; }
    setHunt(h => ({ ...h, ...payload }));
    setEditOpen(false);
  }

  async function handleGearAdded() {
    setAddGearOpen(false);
    const { data: gearData } = await supabase
      .from('hunt_gear')
      .select('id, checked, gear_item_id, gear_items(id, name, brand, category, weight_oz, price, product_url, notes)')
      .eq('hunt_id', id);
    const updated = gearData || [];
    setHuntGear(updated);
    await recalcTotalWeight(updated);
  }

  function handlePrint() { window.print(); }

  const categorized = huntGear.reduce((acc, hg) => {
    const cat = hg.gear_items?.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(hg);
    return acc;
  }, {});

  const sortedCategories = Object.keys(categorized).sort();

  const categoryWeights = sortedCategories.map(cat => ({
    cat,
    oz: categorized[cat].reduce((s, hg) => s + (hg.gear_items?.weight_oz || 0), 0),
    count: categorized[cat].length,
  }));

  const checkedCount = huntGear.filter(hg => hg.checked).length;

  if (loading) {
    return (
      <div className="page">
        <div style={{ color: 'var(--olive-light)', fontFamily: 'Barlow Condensed', letterSpacing: '0.06em' }}>LOADING...</div>
      </div>
    );
  }

  return (
    <div className="page" id="hunt-detail-print">
      <style>{`
        @media print {
          nav, .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .page { padding: 20px !important; }
        }
      `}</style>

      <div className="page-header">
        <div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, color: 'var(--olive-light)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
            <Link to="/hunts" style={{ color: 'var(--olive-light)' }}>Hunts</Link> / {hunt.name}
          </div>
          <h1 style={{ fontSize: 38 }}>{hunt.name}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {hunt.hunt_type && <span className="tag">{hunt.hunt_type}</span>}
            {hunt.days && <span className="tag">{hunt.days} days</span>}
            {hunt.total_weight_oz != null && (
              <span className="weight-badge" style={{ fontSize: 16 }}>{ozToDisplay(hunt.total_weight_oz)}</span>
            )}
          </div>
          {hunt.notes && (
            <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 14, fontStyle: 'italic' }}>{hunt.notes}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} className="no-print">
          <button className="btn-ghost" onClick={handlePrint} style={{ fontSize: 13 }}>⎙ Print / PDF</button>
          <button className="btn-secondary" onClick={() => setEditOpen(true)}>Edit Hunt</button>
          <button className="btn-primary" onClick={() => setAddGearOpen(true)}>+ Add Gear</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 26 }}>Gear Checklist</h2>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, color: 'var(--olive-light)' }}>
              {checkedCount}/{huntGear.length} packed
            </div>
          </div>

          {huntGear.length === 0 ? (
            <div className="empty-state">
              <h3>No Gear Added</h3>
              <p style={{ marginBottom: 20 }}>Add items from your Gear Vault to build this loadout.</p>
              <button className="btn-primary no-print" onClick={() => setAddGearOpen(true)}>Add Gear</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sortedCategories.map(cat => (
                <div key={cat}>
                  <div style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--olive-light)',
                    padding: '10px 0 6px',
                    borderBottom: '1px solid var(--olive-dark)',
                    marginBottom: 6,
                  }}>
                    {cat}
                  </div>
                  {categorized[cat].map(hg => (
                    <div
                      key={hg.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        background: hg.checked ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                        border: '1px solid var(--olive-dark)',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: 5,
                        opacity: hg.checked ? 0.65 : 1,
                        transition: 'opacity 0.15s, background 0.15s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={hg.checked}
                        onChange={() => handleToggleChecked(hg.id, hg.checked)}
                        style={{ width: 'auto', accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: 'Barlow Condensed, sans-serif',
                          fontWeight: 600,
                          fontSize: 15,
                          color: 'var(--white)',
                          textDecoration: hg.checked ? 'line-through' : 'none',
                        }}>
                          {hg.gear_items?.name}
                        </div>
                        {hg.gear_items?.brand && (
                          <div style={{ fontSize: 12, color: 'var(--olive-light)' }}>{hg.gear_items.brand}</div>
                        )}
                      </div>
                      {hg.gear_items?.weight_oz != null && (
                        <span className="weight-badge">{ozToDisplay(hg.gear_items.weight_oz)}</span>
                      )}
                      <button
                        className="btn-icon no-print"
                        onClick={() => handleRemoveGear(hg.id)}
                        title="Remove from hunt"
                        style={{ color: 'var(--danger)', flexShrink: 0 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h4 style={{ fontSize: 16, marginBottom: 14, letterSpacing: '0.06em' }}>WEIGHT BREAKDOWN</h4>
            {huntGear.length === 0 ? (
              <div style={{ color: 'var(--olive-light)', fontSize: 13 }}>No gear added yet.</div>
            ) : (
              <>
                {categoryWeights.map(({ cat, oz, count }) => (
                  <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--olive-dark)' }}>
                    <div>
                      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 600 }}>{cat}</div>
                      <div style={{ fontSize: 11, color: 'var(--olive-light)' }}>{count} item{count !== 1 ? 's' : ''}</div>
                    </div>
                    <span className="weight-badge">{ozToDisplay(oz)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--white)', letterSpacing: '0.06em' }}>TOTAL</div>
                  <span className="weight-badge" style={{ fontSize: 16 }}>{ozToDisplay(hunt.total_weight_oz)}</span>
                </div>
              </>
            )}
          </div>

          <div className="card no-print">
            <h4 style={{ fontSize: 16, marginBottom: 10, letterSpacing: '0.06em' }}>SUMMARY</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--olive-light)' }}>Items</span>
                <span>{huntGear.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--olive-light)' }}>Packed</span>
                <span style={{ color: checkedCount === huntGear.length && huntGear.length > 0 ? 'var(--success)' : 'var(--white)' }}>
                  {checkedCount}/{huntGear.length}
                </span>
              </div>
              {hunt.days && hunt.total_weight_oz > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--olive-light)' }}>Per Day</span>
                  <span className="weight-badge">{ozToDisplay(hunt.total_weight_oz / hunt.days)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {editOpen && (
        <EditHuntModal
          hunt={hunt}
          onClose={() => setEditOpen(false)}
          onSave={handleEditSave}
        />
      )}

      {addGearOpen && (
        <AddGearModal
          huntId={id}
          existingIds={new Set(huntGear.map(hg => hg.gear_item_id))}
          onClose={() => setAddGearOpen(false)}
          onAdd={handleGearAdded}
        />
      )}
    </div>
  );
}
