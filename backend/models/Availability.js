import mongoose from 'mongoose';

const slotTemplateSchema = new mongoose.Schema({
  start: { type: String, required: true },
  end: { type: String, required: true }
}, { _id: false });

const availabilitySchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, unique: true },
  workingDays: [{ type: Number, min: 0, max: 6 }],
  slotDurationMinutes: { type: Number, default: 30, min: 5 },
  slots: [slotTemplateSchema],
  blockedDates: [{ type: String }]
}, { timestamps: true });

export const Availability = mongoose.model('Availability', availabilitySchema);
