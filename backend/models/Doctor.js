import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  image: { type: String, default: '' },
  experience: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  tags: [{ type: String, trim: true }],
  specializations: [{ type: String, trim: true }],
  description: { type: String, default: '' },
  locationName: { type: String, default: 'QuickBook Clinic' },
  address: { type: String, default: '' },
  clinicImages: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Doctor = mongoose.model('Doctor', doctorSchema);
