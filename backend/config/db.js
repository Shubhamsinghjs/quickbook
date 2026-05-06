import mongoose from 'mongoose';

export async function connectDb() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    throw new Error('Missing Mongo URI. Set MONGODB_URI (or MONGO_URI) in Render Environment.');
  }
  if (!uri.startsWith('mongodb+srv://') && !uri.startsWith('mongodb://')) {
    throw new Error('Invalid Mongo URI format. It must start with mongodb+srv:// or mongodb://');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000
  });
}
