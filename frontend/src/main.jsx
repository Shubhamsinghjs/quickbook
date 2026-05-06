import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CalendarDays, Check, MapPin, Mail, Pencil, X, ChevronLeft, ChevronRight } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './styles.css';

const DEFAULT_API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function readScriptConfig() {
  const script = document.currentScript;
  if (!script) return {};
  try {
    const url = new URL(script.src);
    const api = url.searchParams.get('api') || script.dataset.api;
    const mount = url.searchParams.get('mount') || script.dataset.mount;
    return { api, mount };
  } catch {
    return {};
  }
}

const SCRIPT_CONFIG = readScriptConfig();
const API = window.QUICKBOOK_API_URL || SCRIPT_CONFIG.api || DEFAULT_API;
const MOUNT_ID = window.QUICKBOOK_MOUNT_ID || SCRIPT_CONFIG.mount || 'quickbook-widget';

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
  const items = ['Select session', 'Enter details', 'Complete booking'];
  return <aside className="qb-stepper">
    {goBack && <button className="qb-back" onClick={goBack}><ArrowLeft size={20} /> Back</button>}
    <div className="qb-steps">
      {items.map((label, index) => (
        <div key={label} className={`qb-step ${step > index ? 'done' : step === index ? 'active' : ''}`}>
          <span className="qb-step-icon">{step > index ? <Check size={14} /> : index + 1}</span>
          <span>{label}</span>
        </div>
      ))}
    </div>
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
        <div>
          <h3>{doctor.name}</h3>
          <p>{doctor.experience} of experience</p>
          <strong>Rs {doctor.price} for 50 min</strong>
        </div>
      </div>
      <div className="qb-tags">{doctor.tags?.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <div className="qb-mode-row">
        <span className="qb-mode-label">Mode</span>
        <button className="selected">In-person</button>
      </div>
      <NextSlot doctorId={doctor._id} />
      <div className="qb-card-actions">
        <button className="qb-outline">View Profile</button>
        <button className="qb-primary" onClick={() => onBook(doctor)}>Book</button>
      </div>
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
      <header><h3>Choose a date</h3><button onClick={onClose}><X size={20} /></button></header>
      <div className="qb-month">{monthLabel}</div>
      <div className="qb-legend"><span className="ok" />Available <span className="few" />Few slots <span className="off" />Unavailable</div>
      <div className="qb-weekdays">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <b key={i}>{d}</b>)}</div>
      <div className="qb-calendar-grid">
        {days.map((d) => <button key={d.key} disabled={!d.entry?.availableCount} className={`${!d.inMonth ? 'muted' : ''} ${selectedDate === d.key ? 'selected' : ''}`} onClick={() => { onSelect(d.key); onClose(); }}>{d.day}</button>)}
      </div>
    </div>
  </div>;
}

function ClinicCarousel({ images }) {
  const [index, setIndex] = useState(0);
  if (!images || images.length === 0) return null;
  return (
    <div className="qb-carousel">
      <AnimatePresence mode="wait">
        <motion.img 
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          src={imageUrl(images[index])} 
          alt="Clinic" 
        />
      </AnimatePresence>
      {images.length > 1 && (
        <>
          <button className="qb-carousel-btn left" onClick={() => setIndex((i) => (i === 0 ? images.length - 1 : i - 1))}><ChevronLeft size={20} /></button>
          <button className="qb-carousel-btn right" onClick={() => setIndex((i) => (i === images.length - 1 ? 0 : i + 1))}><ChevronRight size={20} /></button>
          <div className="qb-carousel-dots">
            {images.map((_, i) => <span key={i} className={i === index ? 'active' : ''} onClick={() => setIndex(i)} />)}
          </div>
        </>
      )}
    </div>
  );
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
    if (!selection.time) return setError('Please select a time slot');
    setError('');
    try {
      const lock = await request('/slots/lock', { method: 'POST', body: JSON.stringify({ doctor: doctor._id, date: selection.date, time: selection.time }) });
      setSelection({ ...selection, lock });
      next();
    } catch (err) {
      setError(err.message);
    }
  }
  return <div className="qb-book-layout">
    <Stepper step={0} goBack={() => setSelection({})} />
    <section className="qb-panel">
      <p className="qb-subtitle">Mode of Session</p>
      <button className="qb-session-mode selected">In-person</button>
      <h3 className="qb-clinic-name">{doctor.locationName}</h3>
      <p className="qb-clinic-address">{doctor.address}</p>
      {doctor.clinicImages?.length > 0 ? (
        <ClinicCarousel images={doctor.clinicImages} />
      ) : (
        doctor.image && <img className="qb-clinic-fallback" src={imageUrl(doctor.image)} alt="Clinic" />
      )}
      <div className="qb-divider" />
      <h3 className="qb-subtitle">Session Duration</h3>
      <div className="qb-price-line">
        <strong className="qb-brand-text">50 mins, 1 session</strong>
        <span className="qb-price">Rs{doctor.price} / session</span>
      </div>
    </section>
    <section className="qb-panel qb-time-panel">
      <header>
        <h2>Date and Time</h2>
        <button className="qb-icon" onClick={() => setCalendarOpen(true)}><CalendarDays size={20}/></button>
      </header>
      <div className="qb-date-strip">
        {slots.slice(0, 5).map((day) => (
          <button key={day.date} disabled={!day.availableCount} className={selection.date === day.date ? 'selected' : ''} onClick={() => setSelection({ ...selection, date: day.date, time: '' })}>
            <b>{day.day}</b>
            <span>{day.label}</span>
            <small>{day.availableCount ? `${day.availableCount} slots` : 'no slots'}</small>
          </button>
        ))}
      </div>
      <div className="qb-slots-container">
        {Object.entries(grouped).map(([period, list]) => list.length > 0 && (
          <div key={period} className="qb-slot-group">
            <h3>{period}</h3>
            <div>{list.map((slot) => <button key={slot.time} disabled={!slot.available} className={selection.time === slot.time ? 'selected' : ''} onClick={() => setSelection({ ...selection, time: slot.time })}>{slot.time}</button>)}</div>
          </div>
        ))}
      </div>
      <div className="qb-footer-action">
        {error && <p className="qb-error">{error}</p>}
        <button className="qb-primary qb-continue" onClick={continueFlow}>Continue</button>
      </div>
    </section>
    {calendarOpen && <DateModal slots={slots} selectedDate={selection.date} onSelect={(date) => setSelection({ ...selection, date, time: '' })} onClose={() => setCalendarOpen(false)} />}
  </div>;
}

function SummaryCard({ doctor, selection, editable }) {
  return <div className="qb-summary-card">
    <div className="qb-summary-content">
      <p className="qb-light-text">Therapy session with</p>
      <h3>{doctor.name}</h3>
      <p className="qb-clinic-address"><MapPin size={14} className="inline mr-1" />{doctor.locationName}</p>
      <div className="qb-summary-datetime">
        <strong>{selection.date}, {selection.time}</strong>
        <small>50 min at {doctor.locationName}</small>
      </div>
    </div>
    {editable && <button className="qb-edit-btn" onClick={editable}><Pencil size={16} /> Edit</button>}
  </div>;
}

function Details({ doctor, selection, details, setDetails, next, back }) {
  const [error, setError] = useState('');

  function validateAndNext() {
    if (!details.name.trim() || !details.email.trim() || !details.phone) {
      setError('Please fill in all details with a valid phone number');
      return;
    }
    setError('');
    next();
  }

  return <div className="qb-book-layout">
    <Stepper step={1} goBack={back} />
    <section className="qb-panel">
      <h2 className="qb-panel-title">Your Session Details</h2>
      <SummaryCard doctor={doctor} selection={selection} editable={back} />
    </section>
    <section className="qb-panel qb-details">
      <div className="qb-progress">
        <span className="active"><Check size={16} className="inline mr-2" />Personal Details</span>
      </div>
      <div className="qb-form-group">
        <label>Full Name*</label>
        <input className="qb-input" placeholder="Enter your name" value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} />
      </div>
      <div className="qb-form-group">
        <label>Email Address*</label>
        <input className="qb-input" placeholder="Enter email address" type="email" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} />
      </div>
      <div className="qb-form-group">
        <label>Phone Number*</label>
        <PhoneInput
          international
          defaultCountry="IN"
          value={details.phone}
          onChange={(val) => setDetails({ ...details, phone: val })}
          className="qb-phone-input"
        />
      </div>
      {error && <p className="qb-error">{error}</p>}
      <div className="qb-footer-action">
        <button className="qb-primary qb-bottom" onClick={validateAndNext}>Continue to Confirmation</button>
      </div>
    </section>
  </div>;
}

function Countdown({ expiresAt }) {
  const [left, setLeft] = useState(600);
  useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return <div className="qb-countdown">Please complete your booking in <strong>{String(Math.floor(left / 60)).padStart(2, '0')}:{String(left % 60).padStart(2, '0')}</strong></div>;
}

function Confirm({ doctor, selection, details, back }) {
  const [done, setDone] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function confirm() {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const booking = await request('/bookings', { method: 'POST', body: JSON.stringify({ doctor: doctor._id, ...details, date: selection.date, time: selection.time, lockToken: selection.lock.token }) });
      setDone(booking);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }
  if (done) return <div className="qb-success-container">
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="qb-success-card">
      <div className="qb-success-icon"><Mail size={42} /></div>
      <h2>Booking Confirmed!</h2>
      <p>A confirmation email has been sent to <strong>{details.email}</strong>.</p>
      <div className="qb-success-details">
        <p><strong>{doctor.name}</strong></p>
        <p>{selection.date} at {selection.time}</p>
        <p>{doctor.locationName}</p>
      </div>
      <p className="qb-pay-note">Payment to be made at the clinic.</p>
    </motion.div>
  </div>;
  
  return <div className="qb-book-layout">
    <Stepper step={2} goBack={!loading ? back : null} />
    <section className="qb-panel">
      <Countdown expiresAt={selection.lock.expiresAt} />
      <h2 className="qb-panel-title">Verify Session Details</h2>
      <SummaryCard doctor={doctor} selection={selection} editable={!loading ? back : null} />
    </section>
    <section className="qb-panel qb-complete">
      <h2 className="qb-panel-title">Finalize Booking</h2>
      <div className="qb-summary-rows">
        <div className="qb-row"><span>Name</span><strong>{details.name}</strong></div>
        <div className="qb-row"><span>Email</span><strong>{details.email}</strong></div>
        <div className="qb-row"><span>Phone</span><strong>{details.phone}</strong></div>
        <div className="qb-divider" />
        <div className="qb-row"><span>Session Price</span><strong>Rs{doctor.price}.00</strong></div>
        <div className="qb-row total"><span>Amount to Pay at Clinic</span><strong>Rs{doctor.price}.00</strong></div>
      </div>
      {error && <p className="qb-error">{error}</p>}
      <div className="qb-footer-action">
        <button className="qb-primary qb-bottom" onClick={confirm} disabled={loading}>
          {loading ? 'Processing...' : 'Confirm Appointment'}
        </button>
      </div>
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

let mount = document.getElementById(MOUNT_ID);
if (!mount) mount = document.querySelector('[id^="qb-root"]');
if (mount) createRoot(mount).render(<App />);
