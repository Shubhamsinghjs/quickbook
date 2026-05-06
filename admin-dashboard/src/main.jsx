import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { motion } from 'framer-motion';
import { CalendarDays, LogOut, Save, Stethoscope, Trash2 } from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function useApi(token) {
  return useMemo(() => ({
    async request(path, options = {}) {
      const headers = { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const res = await fetch(`${API}${path}`, { ...options, headers: { ...headers, ...options.headers } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Request failed');
      return data;
    }
  }), [token]);
}

function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onLogin(data.token);
    } catch (err) {
      setError(err.message);
    }
  }
  return <main className="min-h-screen bg-slate-100 grid place-items-center p-6">
    <form onSubmit={submit} className="panel w-full max-w-md space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">QuickBook Admin</h1>
        <p className="text-sm text-slate-500">Manage doctors, availability, and bookings.</p>
      </div>
      <input className="input" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input className="input" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn w-full">Login</button>
    </form>
  </main>;
}

function DoctorForm({ api, doctors, refresh }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', experience: '', price: '', tags: '', locationName: '', address: '', image: null });
  const reset = () => { setEditing(null); setForm({ name: '', experience: '', price: '', tags: '', locationName: '', address: '', image: null }); };
  async function save(event) {
    event.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => value !== null && data.append(key, value));
    await api.request(editing ? `/doctors/${editing}` : '/doctors', { method: editing ? 'PUT' : 'POST', body: data });
    reset();
    refresh();
  }
  function edit(doc) {
    setEditing(doc._id);
    setForm({ name: doc.name, experience: doc.experience, price: doc.price, tags: (doc.tags || []).join(', '), locationName: doc.locationName || '', address: doc.address || '', image: null });
  }
  return <section className="grid gap-5 lg:grid-cols-[380px_1fr]">
    <form onSubmit={save} className="panel space-y-3">
      <h2 className="section-title"><Stethoscope size={18} /> Doctor Management</h2>
      <input className="input" placeholder="Doctor name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <input className="input" placeholder="Experience, e.g. 8+ years" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} required />
      <input className="input" placeholder="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
      <input className="input" placeholder="Tags comma separated" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
      <input className="input" placeholder="Clinic name" value={form.locationName} onChange={(e) => setForm({ ...form, locationName: e.target.value })} />
      <textarea className="input min-h-20" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      <input className="input" type="file" accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files[0] })} />
      <div className="flex gap-2">
        <button className="btn"><Save size={16} /> {editing ? 'Update' : 'Add Doctor'}</button>
        {editing && <button type="button" className="btn-secondary" onClick={reset}>Cancel</button>}
      </div>
    </form>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {doctors.map((doc) => <article key={doc._id} className="panel compact">
        <img className="h-36 w-full rounded-md object-cover bg-slate-100" src={doc.image ? `${API.replace('/api', '')}${doc.image}` : ''} alt="" />
        <h3 className="font-bold mt-3">{doc.name}</h3>
        <p className="text-sm text-slate-500">{doc.experience} | Rs {doc.price}</p>
        <div className="tags">{doc.tags?.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <div className="flex gap-2 mt-4">
          <button className="btn-secondary" onClick={() => edit(doc)}>Edit</button>
          <button className="icon-danger" onClick={async () => { await api.request(`/doctors/${doc._id}`, { method: 'DELETE' }); refresh(); }}><Trash2 size={16} /></button>
        </div>
      </article>)}
    </div>
  </section>;
}

function Availability({ api, doctors }) {
  const [doctorId, setDoctorId] = useState('');
  const [form, setForm] = useState({ workingDays: [], slotDurationMinutes: 30, slotsText: '13:00-16:30\n17:00-18:30', blockedDatesText: '' });
  useEffect(() => {
    if (!doctorId) return;
    api.request(`/availability/${doctorId}`).then((data) => setForm({
      workingDays: data.workingDays || [],
      slotDurationMinutes: data.slotDurationMinutes || 30,
      slotsText: (data.slots || []).map((slot) => `${slot.start}-${slot.end}`).join('\n'),
      blockedDatesText: (data.blockedDates || []).join('\n')
    }));
  }, [doctorId]);
  async function save() {
    const slots = form.slotsText.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
      const [start, end] = line.split('-').map((part) => part.trim());
      return { start, end };
    });
    await api.request(`/availability/${doctorId}`, {
      method: 'PUT',
      body: JSON.stringify({
        workingDays: form.workingDays,
        slotDurationMinutes: form.slotDurationMinutes,
        slots,
        blockedDates: form.blockedDatesText.split('\n').map((d) => d.trim()).filter(Boolean)
      })
    });
  }
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return <section className="panel space-y-4">
    <h2 className="section-title"><CalendarDays size={18} /> Availability Management</h2>
    <select className="input" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
      <option value="">Select doctor</option>
      {doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>{doctor.name}</option>)}
    </select>
    {doctorId && <>
      <div className="flex flex-wrap gap-2">
        {days.map((day, index) => <button key={day} type="button" className={form.workingDays.includes(index) ? 'pill-active' : 'pill'} onClick={() => setForm({ ...form, workingDays: form.workingDays.includes(index) ? form.workingDays.filter((d) => d !== index) : [...form.workingDays, index] })}>{day}</button>)}
      </div>
      <input className="input" type="number" min="5" value={form.slotDurationMinutes} onChange={(e) => setForm({ ...form, slotDurationMinutes: Number(e.target.value) })} />
      <textarea className="input min-h-28" value={form.slotsText} onChange={(e) => setForm({ ...form, slotsText: e.target.value })} />
      <textarea className="input min-h-24" placeholder="Blocked dates, one YYYY-MM-DD per line" value={form.blockedDatesText} onChange={(e) => setForm({ ...form, blockedDatesText: e.target.value })} />
      <button className="btn" onClick={save}><Save size={16} /> Save Availability</button>
    </>}
  </section>;
}

function Bookings({ api, doctors }) {
  const [bookings, setBookings] = useState([]);
  const [filters, setFilters] = useState({ doctor: '', date: '', status: '' });
  async function load() {
    const query = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, value]) => value))).toString();
    setBookings(await api.request(`/bookings${query ? `?${query}` : ''}`));
  }
  useEffect(() => { load(); }, []);
  return <section className="panel space-y-4">
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <h2 className="section-title">Booking Management</h2>
      <button className="btn-secondary" onClick={load}>Apply Filters</button>
    </div>
    <div className="grid gap-3 md:grid-cols-3">
      <select className="input" value={filters.doctor} onChange={(e) => setFilters({ ...filters, doctor: e.target.value })}>
        <option value="">All doctors</option>
        {doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>{doctor.name}</option>)}
      </select>
      <input className="input" type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
      <select className="input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
        <option value="">All statuses</option>
        <option>booked</option><option>completed</option><option>cancelled</option>
      </select>
    </div>
    <div className="overflow-x-auto">
      <table className="table">
        <thead><tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Phone</th><th>Status</th></tr></thead>
        <tbody>{bookings.map((booking) => <tr key={booking._id}>
          <td>{booking.name}<span>{booking.email}</span></td>
          <td>{booking.doctor?.name}</td>
          <td>{booking.date}</td>
          <td>{booking.time}</td>
          <td>{booking.phone}</td>
          <td><select className="input small" value={booking.status} onChange={async (e) => { await api.request(`/bookings/${booking._id}/status`, { method: 'PATCH', body: JSON.stringify({ status: e.target.value }) }); load(); }}><option>booked</option><option>completed</option><option>cancelled</option></select></td>
        </tr>)}</tbody>
      </table>
    </div>
  </section>;
}

function DashboardStats({ stats }) {
  const cards = [
    ['Total doctors', stats.totalDoctors || 0],
    ['Total bookings', stats.totalBookings || 0],
    ['Upcoming appointments', stats.upcomingAppointments || 0]
  ];
  return <section className="grid gap-4 md:grid-cols-3">
    {cards.map(([label, value], index) => <motion.article key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="panel">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <strong className="mt-2 block text-3xl text-ink">{value}</strong>
    </motion.article>)}
  </section>;
}

function App() {
  const [token, setToken] = useState(localStorage.quickbookToken || '');
  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState({});
  const api = useApi(token);
  const refresh = () => Promise.all([
    api.request('/doctors/admin/all').then(setDoctors),
    api.request('/bookings/stats').then(setStats)
  ]);
  useEffect(() => { if (token) refresh(); }, [token]);
  if (!token) return <Login onLogin={(value) => { localStorage.quickbookToken = value; setToken(value); }} />;
  return <main className="min-h-screen bg-slate-100 p-5">
    <header className="mx-auto max-w-7xl flex items-center justify-between mb-5">
      <div><h1 className="text-2xl font-bold">QuickBook</h1><p className="text-sm text-slate-500">Clinic appointment operations</p></div>
      <button className="btn-secondary" onClick={() => { localStorage.removeItem('quickbookToken'); setToken(''); }}><LogOut size={16} /> Logout</button>
    </header>
    <div className="mx-auto max-w-7xl space-y-5">
      <DashboardStats stats={stats} />
      <DoctorForm api={api} doctors={doctors} refresh={refresh} />
      <Availability api={api} doctors={doctors} />
      <Bookings api={api} doctors={doctors} />
    </div>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
