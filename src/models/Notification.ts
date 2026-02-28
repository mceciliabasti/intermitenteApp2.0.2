import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'payment-reminder';
  sentTo: {
    user: mongoose.Types.ObjectId;
    read: boolean;
    readAt?: Date;
  }[];
  createdBy: mongoose.Types.ObjectId; // Admin who created it
  targetWorkshop?: mongoose.Types.ObjectId; // For workshop-specific notifications
  dueDate?: Date; // For payment reminders
  metadata?: {
    workshopId?: string;
    installmentNumber?: number;
    amount?: number;
    surcharge?: number; // late payment surcharge
  };
  sent: boolean;
  scheduledFor?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'success', 'payment-reminder'], default: 'info' },
  sentTo: [{
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
  }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  targetWorkshop: { type: Schema.Types.ObjectId, ref: 'Workshop' },
  dueDate: { type: Date },
  metadata: {
    workshopId: { type: String },
    installmentNumber: { type: Number },
    amount: { type: Number },
    surcharge: { type: Number },
  },
  sent: { type: Boolean, default: false },
  scheduledFor: { type: Date },
}, {
  timestamps: true,
});

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);