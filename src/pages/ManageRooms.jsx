import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { roomService } from '../services/supabaseService';

export default function ManageRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    floor: '',
    building: '',
    type: '',
    description: '',
    emoji: '🏢',
    available: true
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    const { data } = await roomService.getAllRooms();
    setRooms(data || []);
    setLoading(false);
  };

  const handleAddRoom = () => {
    setEditingRoomId(null);
    setFormData({
      name: '',
      capacity: '',
      floor: '',
      building: '',
      type: '',
      description: '',
      emoji: '🏢',
      available: true
    });
    setShowModal(true);
  };

  const handleEditRoom = (room) => {
    setEditingRoomId(room.id);
    setFormData({
      name: room.name,
      capacity: room.capacity,
      floor: room.floor,
      building: room.building,
      type: room.type,
      description: room.description,
      emoji: room.emoji,
      available: room.available
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (editingRoomId) {
        // Update room
        const { error } = await roomService.updateRoom(editingRoomId, formData);
        if (error) {
          alert('Error updating room: ' + error.message);
        } else {
          setShowModal(false);
          loadRooms();
        }
      } else {
        // Create room
        const { error } = await roomService.createRoom(formData);
        if (error) {
          alert('Error creating room: ' + error.message);
        } else {
          setShowModal(false);
          loadRooms();
        }
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setFormLoading(false);
  };

  const handleDeleteRoom = async (room) => {
    if (!window.confirm(`Are you sure you want to delete "${room.name}"? This cannot be undone.`)) return;

    const { error } = await roomService.deleteRoom(room.id);
    if (error) {
      alert('Error deleting room: ' + error.message);
    } else {
      loadRooms();
    }
  };

  const toggleAvailability = async (room) => {
    const { error } = await roomService.updateRoom(room.id, { available: !room.available });
    if (error) {
      alert('Error updating availability: ' + error.message);
    } else {
      loadRooms();
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <div className="page-title">Manage Rooms</div>
            <div className="page-subtitle">Admin Console — {rooms.length} rooms available</div>
          </div>
          <button className="btn btn-primary" onClick={handleAddRoom}>+ Add Room</button>
        </div>

        <div className="page-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total Rooms', value: rooms.length, icon: '🏢', color: '#EEF2FF' },
              { label: 'Available', value: rooms.filter(r => r.available).length, icon: '✅', color: '#DCFCE7' },
              { label: 'Unavailable', value: rooms.filter(r => !r.available).length, icon: '🔒', color: '#FEE2E2' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{loading ? '…' : s.value}</div>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{s.icon}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Room Name</th><th>Capacity</th><th>Location</th><th>Type</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--clr-text-muted)' }}>Loading rooms…</td></tr>
                  ) : rooms.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--clr-text-muted)' }}>
                      <div style={{ fontSize: 36, marginBottom: 10 }}>🏢</div>
                      <p>No rooms yet. Add your first room to get started.</p>
                    </td></tr>
                  ) : (
                    rooms.map(room => (
                      <tr key={room.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ fontSize: 20 }}>{room.emoji}</div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{room.name}</div>
                          </div>
                        </td>
                        <td style={{ fontSize: 13 }}>{room.capacity} people</td>
                        <td style={{ fontSize: 12, color: 'var(--clr-text-muted)' }}>{room.building}{room.floor ? `, ${room.floor}` : ''}</td>
                        <td style={{ fontSize: 13 }}>{room.type}</td>
                        <td><span className={`badge ${room.available ? 'badge-success' : 'badge-muted'}`}>{room.available ? '● Available' : '○ Unavailable'}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-outline btn-sm" onClick={() => handleEditRoom(room)} title="Edit Room">✏️ Edit</button>
                            <button className={`btn btn-sm ${room.available ? 'btn-warning' : 'btn-success'}`} onClick={() => toggleAvailability(room)} title="Toggle Availability">{room.available ? '🔒 Disable' : '✅ Enable'}</button>
                            <button className="btn btn-outline btn-sm" style={{ borderColor: 'var(--clr-danger)', color: 'var(--clr-danger)' }} onClick={() => handleDeleteRoom(room)} title="Delete Room">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Room Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingRoomId ? 'Edit Room' : 'Add New Room'}</h3>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>✖</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="input-group">
                  <label>Emoji</label>
                  <div className="input-wrap">
                    <input 
                      type="text" 
                      placeholder="🏢" 
                      value={formData.emoji} 
                      onChange={e => setFormData({ ...formData, emoji: e.target.value })}
                      maxLength={2}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Room Name *</label>
                  <div className="input-wrap">
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Conference Room A" 
                      value={formData.name} 
                      onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="input-group">
                  <label>Capacity *</label>
                  <div className="input-wrap">
                    <input 
                      required 
                      type="number" 
                      placeholder="e.g. 10" 
                      value={formData.capacity} 
                      onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })} 
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Type *</label>
                  <div className="input-wrap">
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Meeting Room" 
                      value={formData.type} 
                      onChange={e => setFormData({ ...formData, type: e.target.value })} 
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="input-group">
                  <label>Building *</label>
                  <div className="input-wrap">
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. MCA BLOCK" 
                      value={formData.building} 
                      onChange={e => setFormData({ ...formData, building: e.target.value })} 
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Floor/Location</label>
                  <div className="input-wrap">
                    <input 
                      type="text" 
                      placeholder="e.g. 2nd Floor" 
                      value={formData.floor} 
                      onChange={e => setFormData({ ...formData, floor: e.target.value })} 
                    />
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Description</label>
                <div className="input-wrap">
                  <textarea 
                    placeholder="Room description and features" 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    style={{ minHeight: 80, fontFamily: 'inherit', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--clr-border)', resize: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', background: '#F8FAFC', borderRadius: 6 }}>
                <input 
                  type="checkbox" 
                  id="available"
                  checked={formData.available} 
                  onChange={e => setFormData({ ...formData, available: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <label htmlFor="available" style={{ cursor: 'pointer', margin: 0 }}>Room is available for booking</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Saving...' : editingRoomId ? 'Update Room' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
