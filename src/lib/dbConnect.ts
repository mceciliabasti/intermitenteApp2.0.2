
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('Por favor, define la variable MONGODB_URI en Vercel');
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseConn: Promise<typeof mongoose> | undefined;
}

let cached = global.mongooseConn;

if (!cached) {
  cached = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  global.mongooseConn = cached;
}

async function dbConnect() {
  return cached;
}

export default dbConnect;