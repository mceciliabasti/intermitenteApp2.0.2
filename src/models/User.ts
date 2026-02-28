import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string; // Hashed
  role: 'admin' | 'student';
  firstName: string;
  lastName: string;
  phone: string;
  dni: string;
  enrollments: {
    workshop: mongoose.Types.ObjectId;
    status: 'current' | 'past';
    enabled: boolean;
    enrolledAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'student'], required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  dni: { type: String, required: true },
  enrollments: [{
    workshop: { type: Schema.Types.ObjectId, ref: 'Workshop' },
    status: { type: String, enum: ['current', 'past'], required: true },
    enabled: { type: Boolean, default: true },
    enrolledAt: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);