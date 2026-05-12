import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { slotService } from '../services/supabaseService';

function SlotModal({ slot, onClose, onSave }) {
  const [form, setForm] = useState(slot || { label: '', start_time: '08:00', end_time: '10:00', days: 'Mon–Fri', rooms: 'All', active: true });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{slot ? 'Edit Slot' : 'Add New Slot'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-group">
            <label>Slot Label</label>
            <div className="input-wrap"><input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="e.g. Morning Slot" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label>Start Time</label>
              <div className="input-wrap"><input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} /></div>
            </div>
            <div className="input-group">
              <label>End Time</label>
              <div className="input-wrap"><input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></div>
            </div>
          </div>
          <div className="input-group">
            <label>Days</label>
            <div className="input-wrap"><input value={form.days} onChange={e => setForm({ ...form, days: e.target.value })} /></div>
          </div>
          <div className="input-group">
            <label>Applicable Rooms</label>
            <div className="input-wrap"><input value={form.rooms} onChange={e => setForm({ ...form, rooms: e.target.value })} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button className="btn btn-outline flex-1" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary flex-1" disabled={saving} onClick={handleSave}>{saving ? '⏳ Saving…' : 'Save Slot'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManageSlots() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    slotService.getSlots().then(({ data }) => { setSlots(data || []); setLoading(false); });
  }, []);

  const toggleActive = async (slot) => {
    setUpdating(slot.id);
    setError('');
    const { error: err } = await slotService.updateSlot(slot.id, { active: !slot.active });
    setUpdating(null);
    
    if (err) {
      setError('Error updating slot: ' + err.message);
    } else {
      setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, active: !s.active } : s));
    }
  };

  const deleteSlot = async (id) => {
    if (!confirm('Delete this slot?')) return;
    setUpdating(id);
    setError('');
    const { error: err } = await slotService.deleteSlot(id);
    setUpdating(null);
    
    if (err) {
      setError('Error deleting slot: ' + err.message);
    } else {
      setSlots(prev => prev.filter(s => s.id !== id));
    }
  };

  const saveSlot = async (form) => {
    setError('');
    if (modal === 'add') {
      const { data, error: err } = await slotService.createSlot(form);
      if (err) {
        setError('Error creating slot: ' + err.message);
      } else if (data) {
        setSlots(prev => [...prev, data]);
        setModal(null);
      }
    } else {
      const { data, error: err } = await slotService.updateSlot(modal.id, form);
      if (err) {
        setError('Error updating slot: ' + err.message);
      } else if (data) {
        setSlots(prev => prev.map(s => s.id === modal.id ? data : s));
        setModal(null);
      }
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <div className="page-title">Manage Time Slots</div>
            <div className="page-subtitle">Configure booking availability windows</div>
          </div>
          <button className="btn btn-primary" onClick={() => setModal('add')}>+ Add Slot</button>
        </div>

        <div className="page-body">
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="alert alert-info" style={{ marginBottom: 24 }}>
            Changes take effect for new bookings only. Existing confirmed bookings are not affected.
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Label</th><th>Start</th><th>End</th><th>Days</th><th>Rooms</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--clr-text-muted)' }}>Loading slots…</td></tr>
                  ) : slots.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.label}</td>
                      <td><span className="badge badge-info">{s.start_time}</span></td>
                      <td><span className="badge badge-info">{s.end_time}</span></td>
                      <td style={{ fontSize: 13, color: 'var(--clr-text-muted)' }}>{s.days}</td>
                      <td style={{ fontSize: 13, color: 'var(--clr-text-muted)' }}>{s.rooms}</td>
                      <td>
                        <button onClick={() => toggleActive(s)} disabled={updating === s.id} style={{ padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: updating === s.id ? 0.6 : 1, background: s.active ? '#DCFCE7' : '#F1F5F9', color: s.active ? '#15803D' : '#64748B', border: 'none' }}>
                          {updating === s.id ? '...' : s.active ? '● Active' : '○ Inactive'}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => setModal(s)} disabled={updating}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteSlot(s.id)} disabled={updating === s.id}></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {modal && <SlotModal slot={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={saveSlot} />}
    </div>
  );
}
