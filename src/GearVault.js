import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

const CATEGORIES = [
  'Shelter', 'Sleep', 'Pack', 'Clothing', 'Footwear', 'Navigation',
  'Cooking', 'Food', 'Water', 'First Aid', 'Hunt Essentials', 'Electronics', 'Misc',
];

const WEIGHT_UNITS = ['oz', 'lb'];

function parseWeightToOz(value, unit) {
  const n = parseFloat(value);
  if (isNaN(n)) return null;
  return unit === 'lb' ? Math.round(n * 16 * 10) / 10 : n;
}

function ozToDisplay(oz) {
  if (oz == null) return '—';
  if (oz < 16) return `${parseFloat(oz.toFixed(1))} oz`;
  const lbs = Math.floor(oz / 16);
  const rem = parseFloat((oz % 16).toFixed(1));
  return rem > 0 ? `${lbs} lb ${rem} oz` : `${lbs} lb`;
}

const emptyForm = {
  name: '', brand: '', category: '', weight_value: '', weight_unit: 'oz',
  price: '', product_url: '', notes: '',
};

function GearModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(() => {
    if (item) {
      const oz = item.weight_oz;
      let weight_value = '', weight_unit = 'oz';
      if (oz != null) {
        if (oz >= 16 && oz % 16 === 0) {
          weight_value = String(oz / 16);
          weight_unit = 'lb';
        } else {
          weight_value = String(oz);
          weight_unit = 'oz';
        }
      }
      return {
        name: item.name || '',
        brand: item.brand || '',
        category: item.category || '',
        weight_value,
        weight_unit,
        price: item.price != null ? String(item.price) : '',
        product_url: item.product_url || '',
        notes: item.notes || '',
      };
    }
    return { ...emptyForm };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setError('');
    setLoading(true);

    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim() || null,
      category: form.category || null,
      weight_oz: form.weight_value ? parseWeightToOz(form.weight_value, form.weight_unit) : null,
      price: form.price ? parseFloat(form.price) : null,
      product_url: form.product_url.trim() || null,
      notes: form.notes.trim() || null,
    };

    onSave(payload, setError, setLoading);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{item ? 'Edit Gear' : 'Add Gear'}</h2>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: 22 }}>✕</button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Item Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Zpacks Duplex Tent" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Brand</label>
              <input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Zpacks" />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">— Select —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Weight</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.weight_value}
                  onChange={e => set('weight_value', e.target.value)}
                  placeholder="0"
                  style={{ flex: 1 }}
                />
                <select
                  value={form.weight_unit}
                  onChange={e => set('weight_unit', e.target.value)}
                  style={{ width: 68, flexShrink: 0 }}
                >
                  {WEIGHT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Price ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={e => set('price', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Product URL</label>
            <input
              type="url"
              value={form.product_url}
              onChange={e => set('product_url', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Any notes about this item..."
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GearRow({ item, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--olive-dark)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        transition: 'border-color 0.15s',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(e => !e)}
      >
        <span style={{ color: 'var(--olive-light)', fontSize: 12, width: 16, flexShrink: 0 }}>
          {expanded ? '▲' : '▼'}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--white)' }}>
            {item.name}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            {item.brand && <span style={{ color: 'var(--muted)', fontSize: 13 }}>{item.brand}</span>}
            {item.category && <span className="tag">{item.category}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          {item.weight_oz != null && (
            <span className="weight-badge" style={{ fontSize: 15 }}>{ozToDisplay(item.weight_oz)}</span>
          )}
          <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
            <button className="btn-icon" onClick={() => onEdit(item)} title="Edit">✎</button>
            <button className="btn-icon" onClick={() => onDelete(item)} title="Delete" style={{ color: 'var(--danger)' }}>✕</button>
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--olive-dark)', padding: '14px 16px 16px 44px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {item.price != null && (
            <div style={{ fontSize: 14, color: 'var(--muted)' }}>
              <span style={{ color: 'var(--olive-light)', fontFamily: 'Barlow Condensed', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Price: </span>
              ${item.price.toFixed(2)}
            </div>
          )}
          {item.product_url && (
            <div style={{ fontSize: 14 }}>
              <span style={{ color: 'var(--olive-light)', fontFamily: 'Barlow Condensed', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>URL: </span>
              <a href={item.product_url} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                {item.product_url}
              </a>
            </div>
          )}
          {item.notes && (
            <div style={{ fontSize: 14, color: 'var(--muted)' }}>
              <span style={{ color: 'var(--olive-light)', fontFamily: 'Barlow Condensed', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notes: </span>
              {item.notes}
            </div>
          )}
          {!item.price && !item.product_url && !item.notes && (
            <div style={{ color: 'var(--olive-light)', fontSize: 13, fontStyle: 'italic' }}>No additional details.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GearVault({ session }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');

  const loadItems = useCallback(async () => {
    const { data } = await supabase
      .from('gear_items')
      .select('*')
      .eq('user_id', session.user.id)
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    setItems(data || []);
    setLoading(false);
  }, [session]);

  useEffect(() => { loadItems(); }, [loadItems]);

  async function handleSave(payload, setError, setLoading) {
    if (editItem) {
      const { error } = await supabase
        .from('gear_items')
        .update(payload)
        .eq('id', editItem.id);
      if (error) { setError(error.message); setLoading(false); return; }
    } else {
      const { error } = await supabase
        .from('gear_items')
        .insert({ ...payload, user_id: session.user.id });
      if (error) { setError(error.message); setLoading(false); return; }
    }
    setModalOpen(false);
    setEditItem(null);
    loadItems();
  }

  async function handleDelete(item) {
    await supabase.from('gear_items').delete().eq('id', item.id);
    setDeleteConfirm(null);
    loadItems();
  }

  const filtered = items.filter(i => {
    const matchCat = !filterCategory || i.category === filterCategory;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.brand || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalWeight = filtered.reduce((sum, i) => sum + (i.weight_oz || 0), 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Gear Vault</h1>
          {filtered.length > 0 && (
            <div style={{ marginTop: 4, color: 'var(--muted)', fontFamily: 'Barlow Condensed', fontSize: 14 }}>
              {filtered.length} items · <span className="weight-badge">{ozToDisplay(totalWeight)}</span>
            </div>
          )}
        </div>
        <button
          className="btn-primary"
          onClick={() => { setEditItem(null); setModalOpen(true); }}
        >
          + Add Item
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search gear..."
          style={{ maxWidth: 260 }}
        />
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          style={{ maxWidth: 200 }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(filterCategory || search) && (
          <button className="btn-ghost" onClick={() => { setFilterCategory(''); setSearch(''); }}>
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ color: 'var(--olive-light)', fontFamily: 'Barlow Condensed', letterSpacing: '0.06em' }}>LOADING...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>{items.length === 0 ? 'Vault Empty' : 'No Results'}</h3>
          <p style={{ marginBottom: 20 }}>
            {items.length === 0 ? 'Add your first piece of gear to get started.' : 'Try adjusting your search or filter.'}
          </p>
          {items.length === 0 && (
            <button className="btn-primary" onClick={() => { setEditItem(null); setModalOpen(true); }}>
              Add First Item
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(item => (
            <GearRow
              key={item.id}
              item={item}
              onEdit={i => { setEditItem(i); setModalOpen(true); }}
              onDelete={i => setDeleteConfirm(i)}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <GearModal
          item={editItem}
          onClose={() => { setModalOpen(false); setEditItem(null); }}
          onSave={handleSave}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Item</h2>
              <button className="btn-icon" onClick={() => setDeleteConfirm(null)} style={{ fontSize: 22 }}>✕</button>
            </div>
            <p style={{ color: 'var(--muted)', marginBottom: 8 }}>
              Delete <strong style={{ color: 'var(--white)' }}>{deleteConfirm.name}</strong>? This will also remove it from any hunts.
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
