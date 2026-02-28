import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  user: mongoose.Types.ObjectId;
  workshop: mongoose.Types.ObjectId;
  installmentNumber: number;
  amount: number;
  paid: boolean;
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  workshop: { type: Schema.Types.ObjectId, ref: 'Workshop', required: true },
  installmentNumber: { type: Number, required: true },
  amount: { type: Number, required: true },
  paid: { type: Boolean, default: false },
  dueDate: { type: Date, required: true },
  paidAt: { type: Date },
}, {
  timestamps: true,
});

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);