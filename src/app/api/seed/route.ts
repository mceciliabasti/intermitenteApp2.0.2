import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

export async function POST() {
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
  }

  return NextResponse.json({ message: 'Users seeded' });
}