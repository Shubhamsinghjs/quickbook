import crypto from 'crypto';
import { Availability } from '../models/Availability.js';
import { Booking } from '../models/Booking.js';
import { SlotLock } from '../models/SlotLock.js';

const pad = (value) => String(value).padStart(2, '0');

export function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addMinutes(time, minutes) {
  const [hours, mins] = time.split(':').map(Number);
  const total = hours * 60 + mins + minutes;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

function isBefore(a, b) {
  return a.localeCompare(b) < 0;
}

export function toDisplayTime(time) {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${pad(m)} ${suffix}`;
}

export function to24Hour(display) {
  if (/^\d{2}:\d{2}$/.test(display)) return display;
  const match = display.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return display;
  let hour = Number(match[1]);
  const minute = match[2];
  const period = match[3].toUpperCase();
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return `${pad(hour)}:${minute}`;
}

export async function clearExpiredLocks() {
  await SlotLock.deleteMany({ expiresAt: { $lte: new Date() } });
}

export async function generateSlots(doctorId, fromKey, days = 14) {
  await clearExpiredLocks();
  const availability = await Availability.findOne({ doctor: doctorId });
  if (!availability) return [];

  const start = fromKey ? new Date(`${fromKey}T00:00:00`) : new Date();
  const dates = Array.from({ length: Number(days) || 14 }, (_, index) => {
    const d = new Date(start);
    d.setDate(start.getDate() + index);
    return d;
  });
  const dateKeys = dates.map(toDateKey);
  const bookings = await Booking.find({ doctor: doctorId, date: { $in: dateKeys }, status: 'booked' }).lean();
  const locks = await SlotLock.find({ doctor: doctorId, date: { $in: dateKeys }, expiresAt: { $gt: new Date() } }).lean();
  const taken = new Set([...bookings, ...locks].map((item) => `${item.date}|${item.time}`));

  return dates.map((date) => {
    const key = toDateKey(date);
    const disabledDate = availability.blockedDates.includes(key) || !availability.workingDays.includes(date.getDay());
    const slots = [];

    if (!disabledDate) {
      availability.slots.forEach((range) => {
        for (let cursor = range.start; isBefore(addMinutes(cursor, availability.slotDurationMinutes), range.end) || addMinutes(cursor, availability.slotDurationMinutes) === range.end; cursor = addMinutes(cursor, availability.slotDurationMinutes)) {
          const display = toDisplayTime(cursor);
          slots.push({
            time: display,
            period: Number(cursor.split(':')[0]) < 17 ? 'Afternoon' : 'Evening',
            available: !taken.has(`${key}|${display}`)
          });
        }
      });
    }

    return {
      date: key,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      label: date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
      availableCount: slots.filter((slot) => slot.available).length,
      slots
    };
  });
}

export async function lockSlot({ doctor, date, time }) {
  await clearExpiredLocks();
  const alreadyBooked = await Booking.exists({ doctor, date, time, status: 'booked' });
  if (alreadyBooked) throw Object.assign(new Error('This slot is already booked'), { status: 409 });

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  try {
    return await SlotLock.create({ doctor, date, time, token, expiresAt });
  } catch {
    throw Object.assign(new Error('This slot is temporarily locked'), { status: 409 });
  }
}
