import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/models/User';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/artclub';

async function dbConnect() {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(MONGODB_URI);
}

async function seedUsers() {
  await dbConnect();

  const adminExists = await User.findOne({ email: 'admin@example.com' });
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('MoulinSchool26', 10);
    const admin = new User({
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      firstName: 'Admin',
      lastName: '',
      phone: '123456789',
      dni: '12345678',
    });
    await admin.save();
    console.log('Admin user created');
  } else {
    console.log('Admin user already exists');
  }

  const studentExists = await User.findOne({ email: 'usuario@example.com' });
  if (!studentExists) {
    const hashedPassword = await bcrypt.hash('RougeHigh26', 10);
    const student = new User({
      email: 'usuario@example.com',
      password: hashedPassword,
      role: 'student',
      firstName: 'Usuario',
      lastName: '',
      phone: '987654321',
      dni: '87654321',
    });
    await student.save();
    console.log('Student user created');
  } else {
    console.log('Student user already exists');
  }

  mongoose.connection.close();
}

seedUsers().catch(console.error);