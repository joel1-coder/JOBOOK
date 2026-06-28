import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { rulesService } from '../services/mongodbService';

const defaultRules = {
  max_bookings_per_day: 2,
  max_bookings_per_week: 5,
  max_duration_hours: 4,
  max_capacity_percent: 100,
  min_notice_mins: 30,
  max_advance_days: 14,
  auto_cancel: false,
  auto_cancel_mins: 15,
  allow_weekends: true,
  require_approval: false,
  allow_guest_booking: false,
};

export default function BookingRules() {
  const [rules, setRules] = useState(null);
  const [rulesId, setRulesId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRules = async () => {
      setLoading(true);
      setError('');

      try {
        const { data, error: fetchError } = await rulesService.getRules();
        if (fetchError) {
          console.error('Failed to load booking rules:', fetchError);
          setError('Unable to load booking rules. Please try again later.');
          return;
        }

        if (!data) {
          const { data: newRule, error: createError } = await rulesService.createRules(defaultRules);
          if (createError) {
            console.error('Failed to create default booking rules:', createError);
            setError('Unable to initialize booking rules. Please contact support.');
            return;
          }
          setRulesId(newRule.id);
          setRules(newRule);
          return;
        }

        setRulesId(data.id);
        setRules(data);
      } catch (err) {
        console.error('Unexpected error loading booking rules:', err);
        setError('Unexpected error loading booking rules. Refresh the page to try again.');
      } finally {
        setLoading(false);
      }
    };

    loadRules();
  }, []);

  const set = (key, val) => setRules(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    await rulesService.updateRules(rulesId, rules);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const Toggle = ({ label, desc, k }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--clr-border)' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginTop: 2 }}>{desc}</div>}
      </div>
      <button onClick={() => set(k, !rules[k])} style={{ width: 46, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer', background: rules[k] ? 'var(--clr-primary)' : 'var(--clr-border)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: rules[k] ? 22 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
      </button>
    </div>
  );

  const NumberInput = ({ label, k, min, max, suffix }) => (
    <div style={{ padding: '16px 0', borderBottom: '1px solid var(--clr-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-outline btn-sm" style={{ width: 28, height: 28, padding: 0 }} onClick={() => set(k, Math.max(min, rules[k] - 1))}>−</button>
          <span style={{ fontWeight: 700, fontSize: 16, minWidth: 36, textAlign: 'center' }}>{rules[k]}</span>
          <button className="btn btn-outline btn-sm" style={{ width: 28, height: 28, padding: 0 }} onClick={() => set(k, Math.min(max, rules[k] + 1))}>+</button>
          {suffix && <span style={{ fontSize: 12, color: 'var(--clr-text-muted)' }}>{suffix}</span>}
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--clr-text-muted)' }}>Loading rules…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ color: 'var(--clr-danger)', fontWeight: 600 }}>Error</div>
        <p style={{ color: 'var(--clr-text-muted)', textAlign: 'center', maxWidth: 420 }}>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Reload</button>
      </div>
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <div className="page-title">Booking Rules & Settings</div>
            <div className="page-subtitle">Configure system-wide booking policies</div>
          </div>
          <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save Rules'}
          </button>
        </div>

        <div className="page-body">
          {saved && <div className="alert alert-info">Booking rules saved to database!</div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <div className="card card-lg">
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Booking Limits</h3>
              <p style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginBottom: 16 }}>Control how many bookings users can make</p>
              <NumberInput label="Max Bookings / Day" k="max_bookings_per_day" min={1} max={20} suffix="bookings" />
              <NumberInput label="Max Bookings / Week" k="max_bookings_per_week" min={1} max={50} suffix="bookings" />
              <NumberInput label="Max Duration" k="max_duration_hours" min={1} max={12} suffix="hours" />
              <NumberInput label="Max Capacity Override" k="max_capacity_percent" min={10} max={100} suffix="%" />
            </div>

            <div className="card card-lg">
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Timing Rules</h3>
              <p style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginBottom: 16 }}>Configure advance booking and notice periods</p>
              <NumberInput label="Min Notice Period" k="min_notice_mins" min={0} max={240} suffix="mins" />
              <NumberInput label="Max Advance Booking" k="max_advance_days" min={1} max={90} suffix="days" />
              <NumberInput label="Auto-Cancel After" k="auto_cancel_mins" min={5} max={60} suffix="mins" />
            </div>

            <div className="card card-lg">
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Booking Policies</h3>
              <p style={{ fontSize: 12, color: 'var(--clr-text-muted)', marginBottom: 8 }}>Toggle system-wide features on or off</p>
              <Toggle label="Allow Weekend Bookings" desc="Rooms can be booked on Saturdays and Sundays" k="allow_weekends" />
              <Toggle label="Require Admin Approval" desc="All new bookings must be approved by an admin" k="require_approval" />
              <Toggle label="Auto-Cancel No-Shows" desc="Automatically cancel bookings when check-in is missed" k="auto_cancel" />
              <Toggle label="Allow Guest Booking" desc="Non-registered users can make bookings with a link" k="allow_guest_booking" />
            </div>

            <div className="card card-lg" style={{ background: 'linear-gradient(135deg,#0F172A,#1E293B)', color: '#fff', border: 'none' }}>
              <h3 style={{ fontWeight: 700, marginBottom: 4, color: '#fff' }}>Rules Summary</h3>
              <p style={{ fontSize: 12, opacity: .6, marginBottom: 16 }}>Current configuration</p>
              {[
                { label: 'Daily Limit', value: `${rules.max_bookings_per_day} bookings` },
                { label: 'Weekly Limit', value: `${rules.max_bookings_per_week} bookings` },
                { label: 'Max Duration', value: `${rules.max_duration_hours} hrs` },
                { label: 'Advance Booking', value: `${rules.max_advance_days} days` },
                { label: 'Min Notice', value: `${rules.min_notice_mins} mins` },
                { label: 'Weekend Booking', value: rules.allow_weekends ? 'Allowed' : 'Disabled' },
                { label: 'Admin Approval', value: rules.require_approval ? 'Required' : 'Not required' },
                { label: 'Auto-Cancel', value: rules.auto_cancel ? `After ${rules.auto_cancel_mins} mins` : 'Off' },
                { label: 'Guest Booking', value: rules.allow_guest_booking ? 'Enabled' : 'Disabled' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.08)', fontSize: 13 }}>
                  <span style={{ opacity: .65 }}>{r.label}</span>
                  <span style={{ fontWeight: 600 }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
