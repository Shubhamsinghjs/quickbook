import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarDays, Check, Home, Mail, Pencil, X } from 'lucide-react';
import './styles.css';

const API = window.QUICKBOOK_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const imageUrl = (url) => url ? `${API.replace('/api', '')}${url}` : '';
const todayKey = () => new Date().toISOString().slice(0, 10);

function Stepper({ step, goBack }) {
  const items = ['Select session details', 'Enter your details', 'Complete your booking'];
  return <aside className="qb-stepper">
    <button className="qb-back" onClick={goBack}><ArrowLeft size={22} /></button>
    <div className="qb-steps">{items.map((label, index) => <div key={label} className="qb-step">
      <span className={`qb-step-icon ${step > index ? 'done' : step === index ? 'active' : ''}`}>{step > index ? <Check size={16} /> : index + 1}</span>
      <span>{label}</span>
    </div>)}</div>
  </aside>;
}

function DoctorCards({ onBook }) {
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { request('/doctors').then(setDoctors).catch((err) => setError(err.message)); }, []);
  if (error) return <p className="qb-error">{error}</p>;
  return <section className="qb-doctor-grid">
    {doctors.map((doctor, index) => <motion.article key={doctor._id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="qb-doctor-card">
      <div className="qb-doctor-top">
        <img src={imageUrl(doctor.image)} alt={doctor.name} />
        <div><h3>{doctor.name}</h3><p>{doctor.experience} of experience</p><strong>Rs {doctor.price} for 50 min</strong></div>
      </div>
      <div className="qb-tags">{doctor.tags?.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <p className="qb-mode-label">Mode</p>
      <div className="qb-mode-row"><button className="selected">In-person</button></div>
      <NextSlot doctorId={doctor._id} />
      <div className="qb-card-actions"><button className="qb-outline">View Profile</button><button className="qb-primary" onClick={() => onBook(doctor)}>Book</button></div>
    </motion.article>)}
  </section>;
}

function NextSlot({ doctorId }) {
  const [text, setText] = useState('Checking availability...');
  useEffect(() => {
    request(`/slots/${doctorId}?from=${todayKey()}&days=14`).then((days) => {
      const day = days.find((item) => item.slots?.some((slot) => slot.available));
      const slot = day?.slots.find((item) => item.available);
      setText(day && slot ? `Next available slot: ${day.label}, ${slot.time}` : 'No available slots');
    }).catch(() => setText('Availability not configured'));
  }, [doctorId]);
  return <p className="qb-next">{text}</p>;
}

function DateModal({ slots, selectedDate, onSelect, onClose }) {
  const first = slots[0]?.date ? new Date(`${slots[0].date}T00:00:00`) : new Date();
  const monthLabel = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = Array.from({ length: 35 }, (_, index) => {
    const date = new Date(first.getFullYear(), first.getMonth(), 1 + index);
    const key = date.toISOString().slice(0, 10);
    const entry = slots.find((slot) => slot.date === key);
    return { key, day: date.getDate(), inMonth: date.getMonth() === first.getMonth(), entry };
  });
  return <div className="qb-modal-dim">
    <div className="qb-calendar-modal">
      <header><h3>Choose a date</h3><button onClick={onClose}><X /></button></header>
      <div className="qb-month">{monthLabel}</div>
      <div className="qb-legend"><span className="ok" />Available <span className="few" />Few slots available <span className="off" />Unavailable</div>
      <div className="qb-weekdays">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => <b key={d}>{d}</b>)}</div>
      <div className="qb-calendar-grid">{days.map((d) => <button key={d.key} disabled={!d.entry?.availableCount} className={`${!d.inMonth ? 'muted' : ''} ${selectedDate === d.key ? 'selected' : ''}`} onClick={() => { onSelect(d.key); onClose(); }}>{d.day}</button>)}</div>
    </div>
  </div>;
}

function SlotPicker({ doctor, selection, setSelection, next }) {
  const [slots, setSlots] = useState([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { request(`/slots/${doctor._id}?from=${todayKey()}&days=21`).then((data) => { setSlots(data); setSelection((s) => ({ ...s, date: s.date || data.find((d) => d.availableCount)?.date || data[0]?.date })); }).catch((err) => setError(err.message)); }, [doctor._id]);
  const selectedDay = slots.find((day) => day.date === selection.date) || slots[0];
  const grouped = useMemo(() => ({
    Afternoon: selectedDay?.slots?.filter((slot) => slot.period === 'Afternoon') || [],
    Evening: selectedDay?.slots?.filter((slot) => slot.period === 'Evening') || []
  }), [selectedDay]);
  async function continueFlow() {
    if (!selection.time) return setError('Select a time slot');
    const lock = await request('/slots/lock', { method: 'POST', body: JSON.stringify({ doctor: doctor._id, date: selection.date, time: selection.time }) });
    setSelection({ ...selection, lock });
    next();
  }
  return <div className="qb-book-layout">
    <Stepper step={0} goBack={() => setSelection({})} />
    <section className="qb-panel">
      <h2>Mode of Session</h2>
      <button className="qb-session-mode"><Home />In-person</button>
      <h3>{doctor.locationName}</h3>
      <p>{doctor.address}</p>
      <img className="qb-clinic" src={imageUrl(doctor.image)} alt="" />
      <h3>Session Duration</h3>
      <div className="qb-price-line"><strong>50 mins, 1 session</strong><span>Rs{doctor.price} / session</span></div>
    </section>
    <section className="qb-panel qb-time-panel">
      <header><h2>Date and Time</h2><button className="qb-icon" onClick={() => setCalendarOpen(true)}><CalendarDays /></button></header>
      <div className="qb-date-strip">{slots.slice(0, 5).map((day) => <button key={day.date} disabled={!day.availableCount} className={selection.date === day.date ? 'selected' : ''} onClick={() => setSelection({ ...selection, date: day.date, time: '' })}><b>{day.day}</b><span>{day.label}</span><small>{day.availableCount ? `${day.availableCount} slots` : 'no slots'}</small></button>)}</div>
      {Object.entries(grouped).map(([period, list]) => <div key={period} className="qb-slot-group"><h3>{period}</h3><div>{list.map((slot) => <button key={slot.time} disabled={!slot.available} className={selection.time === slot.time ? 'selected' : ''} onClick={() => setSelection({ ...selection, time: slot.time })}>{slot.time}</button>)}</div></div>)}
      {error && <p className="qb-error">{error}</p>}
      <footer><button className="qb-primary qb-continue" onClick={continueFlow}>Continue</button></footer>
    </section>
    {calendarOpen && <DateModal slots={slots} selectedDate={selection.date} onSelect={(date) => setSelection({ ...selection, date, time: '' })} onClose={() => setCalendarOpen(false)} />}
  </div>;
}

function Details({ doctor, selection, details, setDetails, next, back }) {
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  async function sendOtp() {
    await request('/otp/send', { method: 'POST', body: JSON.stringify({ email: details.email }) });
    setOtpSent(true);
  }
  async function verify() {
    await request('/otp/verify', { method: 'POST', body: JSON.stringify({ email: details.email, code: otp }) });
    next();
  }
  return <div className="qb-book-layout">
    <Stepper step={1} goBack={back} />
    <section className="qb-panel qb-wide">
      <h2>Your Session Details:</h2>
      <SummaryCard doctor={doctor} selection={selection} editable={back} />
    </section>
    <section className="qb-panel qb-details">
      <div className="qb-progress"><span className="done"><Check size={14} /> Email OTP</span><span>Personal Details</span></div>
      <input placeholder="Name" value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} />
      <input placeholder="Email" type="email" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} />
      <input placeholder="Phone" value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} />
      {otpSent && <input placeholder="Enter email OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />}
      {error && <p className="qb-error">{error}</p>}
      <button className="qb-primary qb-bottom" onClick={() => (otpSent ? verify() : sendOtp()).catch((err) => setError(err.message))}>{otpSent ? 'Verify OTP' : 'Send OTP'}</button>
    </section>
  </div>;
}

function SummaryCard({ doctor, selection, editable }) {
  return <div className="qb-summary-card">
    <img src={imageUrl(doctor.image)} alt="" />
    <div><p>Therapy session with</p><h3>{doctor.name}</h3><p>{doctor.locationName}</p><strong>{selection.date}, {selection.time} IST</strong><small>50 min at {doctor.locationName}</small></div>
    {editable && <button onClick={editable}><Pencil size={18} /> Edit</button>}
  </div>;
}

function Countdown({ expiresAt }) {
  const [left, setLeft] = useState(600);
  useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return <div className="qb-countdown">Please complete this booking in {String(Math.floor(left / 60)).padStart(2, '0')}:{String(left % 60).padStart(2, '0')}</div>;
}

function Confirm({ doctor, selection, details, back }) {
  const [done, setDone] = useState(null);
  const [error, setError] = useState('');
  async function confirm() {
    const booking = await request('/bookings', { method: 'POST', body: JSON.stringify({ doctor: doctor._id, ...details, date: selection.date, time: selection.time, lockToken: selection.lock.token }) });
    setDone(booking);
  }
  if (done) return <div className="qb-success"><Mail size={42} /><h2>Booking confirmed</h2><p>Confirmation has been sent to {details.email}. Pay at clinic.</p></div>;
  return <div className="qb-book-layout">
    <Stepper step={2} goBack={back} />
    <section className="qb-panel qb-wide">
      <Countdown expiresAt={selection.lock.expiresAt} />
      <h2>Your Session Details:</h2>
      <SummaryCard doctor={doctor} selection={selection} editable={back} />
      <p>Confirmation email will be sent to <strong>{details.email}</strong>.</p>
    </section>
    <section className="qb-panel qb-complete">
      <h2>Complete Your Booking</h2>
      <div className="qb-row"><span>Name</span><strong>{details.name}</strong></div>
      <div className="qb-row"><span>Phone number</span><strong>{details.phone}</strong></div>
      <div className="qb-row"><span>Standard session price</span><strong>Rs{doctor.price}.00</strong></div>
      <div className="qb-row total"><span>Final amount to Pay</span><strong>Rs{doctor.price}.00</strong></div>
      <p className="qb-pay">Pay at clinic</p>
      {error && <p className="qb-error">{error}</p>}
      <button className="qb-primary qb-bottom" onClick={() => confirm().catch((err) => setError(err.message))}>Confirm Booking</button>
    </section>
  </div>;
}

function App() {
  const [doctor, setDoctor] = useState(null);
  const [step, setStep] = useState(0);
  const [selection, setSelection] = useState({});
  const [details, setDetails] = useState({ name: '', email: '', phone: '' });
  if (!doctor) return <DoctorCards onBook={(doc) => { setDoctor(doc); setStep(0); }} />;
  if (step === 0) return <SlotPicker doctor={doctor} selection={selection} setSelection={setSelection} next={() => setStep(1)} />;
  if (step === 1) return <Details doctor={doctor} selection={selection} details={details} setDetails={setDetails} next={() => setStep(2)} back={() => setStep(0)} />;
  return <Confirm doctor={doctor} selection={selection} details={details} back={() => setStep(1)} />;
}

const mountId = window.QUICKBOOK_MOUNT_ID || 'quickbook-widget';
const mount = document.getElementById(mountId);
if (mount) createRoot(mount).render(<App />);
