import mongoose, { Schema, Document } from 'mongoose';

export interface IMaterial extends Document {
  title: string;
  type: 'audio' | 'video' | 'pdf' | 'image';
  fileUrl: string;
  enabled: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSchema: Schema = new Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['audio', 'video', 'pdf', 'image'], required: true },
  fileUrl: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  tags: [{ type: String }],
}, { timestamps: true });

export default mongoose.models.Material || mongoose.model<IMaterial>('Material', MaterialSchema);
