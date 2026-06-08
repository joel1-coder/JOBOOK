import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { roomService } from '../services/mongodbService';

export default function ManageRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', capacity: '', floor: '', building: '',
    type: '', description: '', image_url: '', available: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => { loadRooms(); }, []);

  const loadRooms = async () => {
    setLoading(true);
    const { data } = await roomService.getAllRooms();
    setRooms(data || []);
    setLoading(false);
  };

  const handleAddRoom = () => {
    setEditingRoomId(null);
    setFormData({ name: '', capacity: '', floor: '', building: '', type: '', description: '', image_url: '', available: true });
    setShowModal(true);
  };

  const handleEditRoom = (room) => {
    setEditingRoomId(room.id);
    setFormData({ name: room.name, capacity: room.capacity, floor: room.floor, building: room.building, type: room.type, description: room.description, image_url: room.image_url || '', emoji: room.emoji, available: room.available });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    try {
      const fn = editingRoomId
        ? roomService.updateRoom(editingRoomId, formData)
        : roomService.createRoom(formData);
      const { error: err } = await fn;
      if (err) setError('Error: ' + err.message);
      else { setShowModal(false); loadRooms(); }
    } catch (err) { setError('Error: ' + err.message); }
    setFormLoading(false);
  };

  const handleDeleteRoom = async (room) => {
    if (!window.confirm(`Delete "${room.name}"? This cannot be undone.`)) return;
    setUpdating(room.id);
    setError('');
    const { error: err } = await roomService.deleteRoom(room.id);
    setUpdating(null);
    
    if (err) {
      setError('Error deleting room: ' + err.message);
    } else {
      loadRooms();
    }
  };

  const toggleAvailability = async (room) => {
    setUpdating(room.id);
    setError('');
    const { error: err } = await roomService.updateRoom(room.id, { available: !room.available });
    setUpdating(null);
    
    if (err) {
      setError('Error updating room: ' + err.message);
    } else {
      loadRooms();
    }
  };

  const roomImage = (room) => room?.image_url || '/sjc-trichy.avif';

  const stats = [
    { label: 'All', value: rooms.length, color: 'linear-gradient(135deg,rgba(99,102,241,.24),rgba(99,102,241,.08))', accent: '#A5B4FC' },
    { label: 'Available', value: rooms.filter(r => r.available).length, color: 'linear-gradient(135deg,rgba(16,185,129,.24),rgba(16,185,129,.08))', accent: '#6EE7B7' },
    { label: 'Unavailable', value: rooms.filter(r => !r.available).length, color: 'linear-gradient(135deg,rgba(239,68,68,.25),rgba(239,68,68,.08))', accent: '#FCA5A5' },
    { label: 'Capacity', value: rooms.reduce((total, r) => total + (Number(r.capacity) || 0), 0), color: 'linear-gradient(135deg,rgba(245,158,11,.26),rgba(245,158,11,.08))', accent: '#FCD34D' },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div style={{ minWidth: 0 }}>
            <div className="page-title">Manage Rooms</div>
            <div className="page-subtitle">Admin Console — {rooms.length} rooms</div>
          </div>
          <button className="btn btn-primary" style={{ flexShrink: 0 }} onClick={handleAddRoom}>+ Add Room</button>
        </div>

        <div className="page-body">

          {error && <div className="alert alert-danger">{error}</div>}

          {/* ── Stat Cards ── */}
          <div className="bookings-stats-grid" style={{ marginBottom: 24 }}>
            {stats.map(s => (
              <div key={s.label} className="card" style={{ padding: '16px 20px', borderTop: `3px solid ${s.accent}`, background: s.color }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#C7D2FE', textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: s.accent }}>{loading ? '…' : s.value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop Table ── */}
          <div className="card rooms-table-view" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Room Name</th><th>Capacity</th><th>Location</th>
                    <th>Type</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--clr-text-muted)' }}>Loading rooms…</td></tr>
                  ) : rooms.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--clr-text-muted)' }}>
                      <p>No rooms yet. Add your first room.</p>
                    </td></tr>
                  ) : rooms.map(room => (
                    <tr key={room.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={roomImage(room)} alt={room.name} style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{room.name}</div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13 }}>{room.capacity} people</td>
                      <td style={{ fontSize: 12, color: 'var(--clr-text-muted)' }}>{room.building}{room.floor ? `, ${room.floor}` : ''}</td>
                      <td style={{ fontSize: 13 }}>{room.type}</td>
                      <td><span className={`badge ${room.available ? 'badge-success' : 'badge-muted'}`}>{room.available ? '● Available' : '○ Unavailable'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => handleEditRoom(room)} disabled={updating}>Edit</button>
                          <button className={`btn btn-sm ${room.available ? 'btn-warning' : 'btn-success'}`} onClick={() => toggleAvailability(room)} disabled={updating === room.id}>
                            {updating === room.id ? '...' : room.available ? 'Disable' : 'Enable'}
                          </button>
                          <button className="btn btn-outline btn-sm" style={{ borderColor: 'var(--clr-danger)', color: 'var(--clr-danger)' }} onClick={() => handleDeleteRoom(room)} title="Delete Room" aria-label="Delete Room" disabled={updating === room.id}>
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile Card List (hidden on desktop) ── */}
          <div className="rooms-card-list">
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--clr-text-muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}></div>
                <p>Loading rooms…</p>
              </div>
            ) : rooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--clr-text-muted)' }}>
                <p style={{ fontWeight: 600 }}>No rooms yet</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Tap "+ Add Room" to add your first room.</p>
              </div>
            ) : rooms.map(room => (
              <div key={room.id} className="card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <img src={roomImage(room)} alt={room.name} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{room.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginTop: 2 }}>{room.type} · {room.capacity} people</div>
                  </div>
                  <span className={`badge ${room.available ? 'badge-success' : 'badge-muted'}`} style={{ flexShrink: 0 }}>
                    {room.available ? '' : ''}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--clr-text-muted)', marginBottom: 14 }}>
                  <span>{room.building}{room.floor ? `, ${room.floor}` : ''}</span>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => handleEditRoom(room)}>Edit</button>
                  <button className={`btn btn-sm ${room.available ? 'btn-warning' : 'btn-success'}`} onClick={() => toggleAvailability(room)}>
                    {room.available ? 'Disable' : 'Enable'}
                  </button>
                  <button className="btn btn-outline btn-sm" style={{ borderColor: 'var(--clr-danger)', color: 'var(--clr-danger)' }} onClick={() => handleDeleteRoom(room)}>
                    <Trash2 size={14} aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingRoomId ? 'Edit Room' : 'Add New Room'}</h3>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>✖</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="modal-form-grid">
                <div className="input-group">
                  <label>Emoji</label>
                  <div className="input-wrap">
                    <input type="text" placeholder="" value={formData.emoji} onChange={e => setFormData({ ...formData, emoji: e.target.value })} maxLength={2} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Room Name *</label>
                  <div className="input-wrap">
                    <input required type="text" placeholder="e.g. Conference Room A" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '96px 1fr', gap: 14, alignItems: 'center' }}>
                <img src={formData.image_url || '/sjc-trichy.avif'} alt="Room preview" style={{ width: 96, height: 72, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--clr-border)' }} />
                <div className="input-group">
                  <label>Room Image URL</label>
                  <div className="input-wrap">
                    <input type="url" placeholder="https://example.com/room-photo.jpg" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="modal-form-grid">
                <div className="input-group">
                  <label>Capacity *</label>
                  <div className="input-wrap">
                    <input required type="number" placeholder="e.g. 10" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Type *</label>
                  <div className="input-wrap">
                    <input required type="text" placeholder="e.g. Meeting Room" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="modal-form-grid">
                <div className="input-group">
                  <label>Building *</label>
                  <div className="input-wrap">
                    <input required type="text" placeholder="e.g. MCA BLOCK" value={formData.building} onChange={e => setFormData({ ...formData, building: e.target.value })} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Floor / Location</label>
                  <div className="input-wrap">
                    <input type="text" placeholder="e.g. 2nd Floor" value={formData.floor} onChange={e => setFormData({ ...formData, floor: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Description</label>
                <textarea
                  placeholder="Room description and features"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', minHeight: 80, fontFamily: 'var(--font)', fontSize: 14, color: 'var(--clr-text)', padding: '10px 14px', border: '1.5px solid var(--clr-border)', borderRadius: 'var(--radius-sm)', resize: 'none', background: 'var(--clr-surface)' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--clr-surface2)', borderRadius: 8 }}>
                <input type="checkbox" id="available" checked={formData.available} onChange={e => setFormData({ ...formData, available: e.target.checked })} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                <label htmlFor="available" style={{ cursor: 'pointer', margin: 0, fontSize: 14 }}>Room is available for booking</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 4 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Saving…' : editingRoomId ? 'Update Room' : '+ Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
