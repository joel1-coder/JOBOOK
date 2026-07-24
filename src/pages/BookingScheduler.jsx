import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mongoClient } from '../lib/mongodb';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { rulesService, bookingService } from '../services/mongodbService';

/* ── Mini Calendar ───────────────────────────────────────── */
function MiniCalendar({ selected, onSelect, rules }) {
  const today = new Date();
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year = view.getFullYear(), month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  const fmt = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const isPast = (d) => new Date(fmt(d)) < new Date(today.toDateString());
  const maxAdvanceDate = (() => {
    if (!rules || rules.max_advance_days == null) return null;
    const dt = new Date();
    dt.setDate(dt.getDate() + Number(rules.max_advance_days));
    dt.setHours(23, 59, 59, 999);
    return dt;
  })();
  const isBeyondAdvance = (d) => maxAdvanceDate ? new Date(fmt(d)) > maxAdvanceDate : false;
  const isWeekend = (d) => new Date(fmt(d)).getDay() % 6 === 0;
  const isSelected = (d) => fmt(d) === selected;
  const isToday = (d) => fmt(d) === today.toISOString().split('T')[0];
  const isDisabled = (d) => isPast(d) || isBeyondAdvance(d) || (rules?.allow_weekends === false && isWeekend(d));

  return (
    <div className="schedule-light-panel" style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>
          {view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setView(new Date(year, month - 1))} style={{ background: '#F1F5F9', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 700 }}>‹</button>
          <button onClick={() => setView(new Date(year, month + 1))} style={{ background: '#F1F5F9', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 700 }}>›</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#94A3B8', padding: 4 }}>{d}</div>
        ))}
        {days.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', padding: 0, display: 'flex', justifyContent: 'center' }}>
            {d && (
              <button disabled={isDisabled(d)} onClick={() => onSelect(fmt(d))} style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                cursor: isDisabled(d) ? 'not-allowed' : 'pointer',
                background: isSelected(d) ? '#4F46E5' : isToday(d) ? '#EEF2FF' : 'transparent',
                color: isSelected(d) ? '#fff' : isDisabled(d) ? '#CBD5E1' : '#0F172A',
                fontWeight: isSelected(d) || isToday(d) ? 700 : 400, fontSize: 12, transition: 'all .15s',
              }}>{d}</button>
            )}
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>Availability Key</p>
        {[['#22C55E','Available for booking'],['#EF4444','Already reserved'],['#CBD5E1','Past or unavailable'],['#4F46E5','Your selection']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0 }} />{l}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Slot Tile ───────────────────────────────────────────── */
function SlotTile({ slot, status, selected, onSelect }) {
  const cfg = {
    available: { bg: '#F0FDF4', border: '#86EFAC', color: '#15803D', label: 'Available' },
    reserved:  { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', label: 'Reserved'  },
    selected:  { bg: '#4F46E5', border: '#4F46E5', color: '#fff',    label: 'Selected'  },
    closed:    { bg: '#F8FAFC', border: '#E2E8F0', color: '#94A3B8', label: 'Closed'    },
  };
  const key = selected ? 'selected' : status;
  const c = cfg[key] || cfg.available;
  const disabled = status === 'reserved' || status === 'closed';

  return (
    <button disabled={disabled} onClick={() => !disabled && onSelect(slot)} style={{
      background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 10,
      padding: '14px 18px', cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all .15s', textAlign: 'left', minWidth: 120,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: c.color, marginBottom: 3 }}>{slot.start_time}</div>
      <div style={{ fontSize: 11, color: selected ? 'rgba(255,255,255,.8)' : '#64748B', marginBottom: 2 }}>{slot.end_time}</div>
      <div style={{ fontSize: 10, fontWeight: 600, color: c.color, textTransform: 'uppercase', letterSpacing: '.04em' }}>{c.label}</div>
    </button>
  );
}

/* ── Main Schedule Page ──────────────────────────────────── */
export default function SchedulePage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reservedSlotIds, setReservedSlotIds] = useState(new Set());
  const [booking, setBooking] = useState(false);
  const [done, setDone] = useState(false);
  const [rules, setRules] = useState(null);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [rulesError, setRulesError] = useState('');
  const [attendeeCount, setAttendeeCount] = useState(1);

  // Load rooms and admin-configured slots on mount
  useEffect(() => {
    mongoClient.from('rooms').select('*').eq('available', true).order('name').then(({ data }) => {
      setRooms(data || []);
      if (data?.length) {
        const preselected = roomId ? data.find(r => r.id === roomId) : null;
        setSelectedRoom(preselected || data[0]); // auto-select first or matching room
      }
    });
    mongoClient.from('time_slots').select('*').order('start_time').then(({ data }) => {
      // Treat slots with active:true OR active:undefined as active (backward compat)
      setSlots((data || []).filter(s => s.active !== false));
    });
  }, []);

  // Reload reservations when room or date changes
  useEffect(() => {
    if (!selectedRoom || !selectedDate) return;
    setSelectedSlot(null);
    mongoClient.from('bookings')
      .select('slot_id')
      .eq('room_id', selectedRoom.id)
      .eq('date', selectedDate)
      .in('status', ['pending', 'confirmed'])
      .then(({ data }) => setReservedSlotIds(new Set((data || []).map(b => b.slot_id))));
  }, [selectedRoom, selectedDate]);

  useEffect(() => {
    const loadRules = async () => {
      setRulesLoading(true);
      setRulesError('');

      const { data, error } = await rulesService.getRules();
      if (error) {
        console.error('Failed to load booking rules:', error);
        setRulesError('Unable to load booking rules. Please ask your admin to check settings.');
      } else if (!data) {
        setRulesError('Booking rules are not configured yet. Please ask your admin to save the rules again.');
      } else {
        setRules(data);
        setSelectedDate(prev => findNextValidDate(prev, data));
      }
      setRulesLoading(false);
    };

    loadRules();
  }, []);

  const getDateTime = (date, time) => {
    const dt = new Date(`${date}T${time}:00`);
    if (Number.isNaN(dt.getTime())) return null;
    return dt;
  };

  const findNextValidDate = (fromDate, rules) => {
    const date = new Date(`${fromDate}T00:00:00`);
    for (let i = 0; i < 90; i++) {
      const candidate = new Date(date);
      candidate.setDate(date.getDate() + i);
      const str = candidate.toISOString().split('T')[0];
      const weekday = candidate.getDay();
      const now = new Date();
      const maxAdvance = new Date();
      if (rules?.max_advance_days != null) {
        maxAdvance.setDate(maxAdvance.getDate() + Number(rules.max_advance_days));
        maxAdvance.setHours(23, 59, 59, 999);
      }
      if (candidate < new Date(now.toDateString())) continue;
      if (rules?.max_advance_days != null && candidate > maxAdvance) continue;
      if (rules?.allow_weekends === false && (weekday === 0 || weekday === 6)) continue;
      return str;
    }
    return fromDate;
  };

  const getWeekRange = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDay();
    const start = new Date(date);
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const getSlotDurationHours = (slot) => {
    if (!slot?.start_time || !slot?.end_time) return 0;
    const start = getDateTime(selectedDate, slot.start_time);
    const end = getDateTime(selectedDate, slot.end_time);
    if (!start || !end) return 0;
    return (end - start) / 3600000;
  };

  const validateBooking = async () => {
    if (!user || !selectedRoom || !selectedDate || !selectedSlot) return 'Please select a room, date, and time slot.';
    if (rulesLoading) return 'Booking rules are still loading. Please wait a moment.';
    if (rulesError) return rulesError;
    if (!rules) return 'Booking rules are not available.';

    const requested = getDateTime(selectedDate, selectedSlot.start_time);
    if (!requested) return 'Invalid booking date or time.';

    const now = new Date();
    if (requested <= now) return 'Please choose a future date and time.';

    const diffMinutes = Math.ceil((requested - now) / 60000);
    if (rules.min_notice_mins != null && diffMinutes < rules.min_notice_mins) {
      return `Bookings require at least ${rules.min_notice_mins} minutes notice.`;
    }

    const maxAdvanceDate = new Date();
    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + Number(rules.max_advance_days || 0));
    maxAdvanceDate.setHours(23, 59, 59, 999);
    if (rules.max_advance_days != null && requested > maxAdvanceDate) {
      return `You can only book up to ${rules.max_advance_days} days in advance.`;
    }

    const weekday = requested.getDay();
    if (rules.allow_weekends === false && (weekday === 0 || weekday === 6)) {
      return 'Weekend bookings are not allowed by your current rules.';
    }

    const durationHours = getSlotDurationHours(selectedSlot);
    if (rules.max_duration_hours != null && durationHours > Number(rules.max_duration_hours)) {
      return `This slot exceeds the maximum allowed duration of ${rules.max_duration_hours} hours.`;
    }

    const maxAllowedAttendees = Math.max(1, Math.floor((selectedRoom.capacity || 1) * (Number(rules.max_capacity_percent || 100) / 100)));
    if (attendeeCount < 1) {
      return 'Please enter the number of attendees.';
    }
    if (attendeeCount > maxAllowedAttendees) {
      return `This room can only host up to ${maxAllowedAttendees} attendees under current capacity rules.`;
    }

    const { start, end } = getWeekRange(selectedDate);
    const { data: bookings, error: bookingError } = await bookingService.getUserBookings(user.id);
    if (bookingError) {
      console.error('Failed to load user bookings for validation:', bookingError);
      return 'Unable to validate booking limits right now. Please try again later.';
    }

    const validBookings = (bookings || []).filter(b => ['pending', 'confirmed'].includes(b.status));
    const dailyCount = validBookings.filter(b => b.date === selectedDate).length;
    const weekCount = validBookings.filter(b => {
      const bookingDate = new Date(b.date + 'T00:00:00');
      return bookingDate >= start && bookingDate <= end;
    }).length;

    if (rules.max_bookings_per_day != null && dailyCount >= Number(rules.max_bookings_per_day)) {
      return `You have already reached the daily booking limit of ${rules.max_bookings_per_day}.`;
    }
    if (rules.max_bookings_per_week != null && weekCount >= Number(rules.max_bookings_per_week)) {
      return `You have already reached the weekly booking limit of ${rules.max_bookings_per_week}.`;
    }

    return null;
  };

  const morningSlots   = slots.filter(s => parseInt(s.start_time) < 12);
  const afternoonSlots = slots.filter(s => parseInt(s.start_time) >= 12);
  const getStatus = (s) => reservedSlotIds.has(s.id) ? 'reserved' : 'available';
  const roomImage = (room) => room?.image_url || '/sjc-trichy.avif';

  const handleConfirm = async () => {
    if (!selectedDate || !selectedSlot || !selectedRoom || !user) return;
    setBooking(true);

    const validationMessage = await validateBooking();
    if (validationMessage) {
      setBooking(false);
      alert(validationMessage);
      return;
    }

    const status = rules?.require_approval ? 'pending' : 'confirmed';
    const { error } = await bookingService.createBooking({
      userId: user.id,
      roomId: selectedRoom.id,
      slotId: selectedSlot.id,
      date: selectedDate,
      notes: `Attendees: ${attendeeCount}`,
      status,
    });
    setBooking(false);
    if (error) { alert('Booking error: ' + error.message); return; }
    setDone(true);
    setTimeout(() => { setDone(false); setSelectedSlot(null); navigate('/my-bookings'); }, 2000);
  };

  if (done) return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}></div>
          <h2 style={{ fontWeight: 800, fontSize: 24, marginBottom: 8 }}>Booking Requested!</h2>
          <p style={{ color: '#64748B' }}>Pending admin approval. Redirecting…</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {/* Header */}
        <div className="page-header">
          <div>
            <div className="page-title">Schedule Your Space</div>
            <div className="page-subtitle">
              {slots.length === 0
                ? 'No time slots configured yet — ask your admin to add slots'
                : `${slots.length} time slots available · Pick a date and slot to book`}
            </div>
          </div>
        </div>

        <div className="page-body">
          {/* Room Selector */}
          <div className="schedule-light-panel" style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B', flexShrink: 0 }}>Select Room:</span>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 1 }}>
              {rooms.map(r => (
                <button key={r.id} onClick={() => setSelectedRoom(r)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                  borderRadius: 8, border: `1.5px solid ${selectedRoom?.id === r.id ? '#4F46E5' : '#E2E8F0'}`,
                  background: selectedRoom?.id === r.id ? '#EEF2FF' : '#fff',
                  color: selectedRoom?.id === r.id ? '#4F46E5' : '#374151',
                  fontWeight: selectedRoom?.id === r.id ? 700 : 400, cursor: 'pointer',
                  fontSize: 13, transition: 'all .15s',
                }}>
                  {r.name}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content: Calendar + Slots */}
          <div className="responsive-grid">
            {/* Left: Calendar */}
            <MiniCalendar selected={selectedDate} onSelect={setSelectedDate} rules={rules} />

            {/* Right: Room Info + Slots */}
            <div>
              {/* Selected Room Info */}
              {selectedRoom && (
                <div className="schedule-light-panel" style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20, marginBottom: 20, display: 'flex', gap: 20, alignItems: 'center' }}>
                  <img src={roomImage(selectedRoom)} alt={selectedRoom.name} style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, background: '#DCFCE7', color: '#15803D', borderRadius: 999, padding: '2px 10px' }}>● AVAILABLE NOW</span>
                    </div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 5 }}>{selectedRoom.name}</h2>
                    <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#64748B', flexWrap: 'wrap' }}>
                      <span>{selectedRoom.capacity} Persons</span>
                      <span>{selectedRoom.floor}</span>
                      <span>{selectedRoom.building}</span>
                      {selectedRoom.type && <span>{selectedRoom.type}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* No slots message */}
              {slots.length === 0 && (
                <div className="schedule-light-panel" style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 12, border: '1px dashed #E2E8F0' }}>
                  <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No time slots configured</p>
                  <p style={{ fontSize: 13, color: '#64748B' }}>The admin needs to add time slots via <strong>Manage Slots</strong> before you can book.</p>
                </div>
              )}

              {/* Morning Slots (from Admin-configured slots) */}
              {morningSlots.length > 0 && (
                <div className="schedule-light-panel" style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <span style={{ fontSize: 16 }}></span>
                    <h3 style={{ fontWeight: 700, fontSize: 15 }}>Morning Slots</h3>
                    <span style={{ fontSize: 12, color: '#94A3B8', background: '#F8FAFC', borderRadius: 6, padding: '2px 8px' }}>08:00 – 12:00</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {morningSlots.map(s => (
                      <SlotTile key={s.id} slot={s} status={getStatus(s)} selected={selectedSlot?.id === s.id} onSelect={setSelectedSlot} />
                    ))}
                  </div>
                </div>
              )}

              {/* Afternoon Slots */}
              {afternoonSlots.length > 0 && (
                <div className="schedule-light-panel" style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <span style={{ fontSize: 16 }}></span>
                    <h3 style={{ fontWeight: 700, fontSize: 15 }}>Afternoon Slots</h3>
                    <span style={{ fontSize: 12, color: '#94A3B8', background: '#F8FAFC', borderRadius: 6, padding: '2px 8px' }}>12:00 – 18:00</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {afternoonSlots.map(s => (
                      <SlotTile key={s.id} slot={s} status={getStatus(s)} selected={selectedSlot?.id === s.id} onSelect={setSelectedSlot} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Confirm Bar */}
        {selectedSlot && selectedRoom && (
          <div className="schedule-light-panel confirm-bar" style={{
            position: 'sticky', bottom: 0, background: '#fff',
            borderTop: '1px solid #E2E8F0',
            boxShadow: '0 -4px 20px rgba(0,0,0,.08)', zIndex: 20,
            animation: 'fadeUp .2s ease',
          }}>
            <div className="confirm-info-section">
              <div style={{ width: 42, height: 42, background: '#EEF2FF', borderRadius: 10, display: 'none', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}></div>
              <div>
                <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Confirm Selection</div>
                <div className="confirm-details-row">
                  <div>
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>Date</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>Time</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedSlot.start_time} – {selectedSlot.end_time}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>Room</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedRoom.emoji} {selectedRoom.name}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="confirm-action-section">
              <div className="confirm-action-grid">
                <div>
                  <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Attendees</div>
                  <input type="number" min="1" value={attendeeCount} onChange={e => setAttendeeCount(Math.max(1, Number(e.target.value) || 1))} style={{ width: 120, padding: '8px 10px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13 }} />
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Max allowed: {Math.max(1, Math.floor((selectedRoom.capacity || 1) * (Number(rules?.max_capacity_percent || 100) / 100)))}</div>
                </div>
                <div className="confirm-btn-group">
                  <button className="btn btn-outline" onClick={() => setSelectedSlot(null)}>Cancel</button>
                  <button className="btn btn-primary" disabled={booking} onClick={handleConfirm}>
                    {booking ? '⏳ Booking…' : 'Confirm Booking'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
