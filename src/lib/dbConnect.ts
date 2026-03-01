
import mongoose from 'mongoose';

// Extiende el tipo global para incluir mongoose
declare global {
  // eslint-disable-next-line no-var
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}


const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('Por favor, define la variable MONGODB_URI en Vercel');
}

/** * Global se usa aquí para mantener la conexión cacheada 
 * a través de las recargas en desarrollo y las funciones serverless de Vercel.
 */

let cached = global.mongoose;

// Ensure 'cached' is defined before use
if (!cached) {
  cached = { conn: null, promise: null };
  global.mongoose = cached;
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  // 'cached' está garantizado como definido aquí
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;