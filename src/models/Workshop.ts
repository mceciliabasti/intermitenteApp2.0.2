import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkshop extends Document {
  name: string;
  description: string;
  picture: string;
  type: 'quarterly' | 'occasional' | 'anual';
  startDate: Date;
  endDate: Date;
  capacity: number;
  enrolled: number;
  instructor: string;
  installments: number; // Number of payments required
  enabled: boolean;
  sections: {
    pistas: IContent[];
    referencias: IContent[];
    coreos: IContent[];
    guion: IContent[];
    vestuario: IContent[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IContent {
  _id?: string;
  title: string;
  type: 'audio' | 'video' | 'pdf' | 'image';
  fileUrl: string; // Or path
  enabled: boolean;
  tags: string[];
  createdAt: Date;
}

const ContentSchema: Schema = new Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['audio', 'video', 'pdf', 'image'], required: true },
  fileUrl: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  tags: [{ type: String }],
}, { timestamps: true });

const WorkshopSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true }, // Make description required again
  picture: { type: String, required: false, default: '' },
  type: { type: String, enum: ['quarterly', 'occasional', 'anual'], required: true },
  startDate: { type: String, required: true }, // Accept string for date
  endDate: { type: String, required: true }, // Accept string for date
  capacity: { type: Number, required: true },
  enrolled: { type: Number, default: 0 },
  instructor: { type: String, required: true },
  installments: { type: Number, required: true },
  enabled: { type: Boolean, default: true },
  sections: {
    pistas: { type: [ContentSchema], default: [] },
    referencias: { type: [ContentSchema], default: [] },
    coreos: { type: [ContentSchema], default: [] },
    guion: { type: [ContentSchema], default: [] },
    vestuario: { type: [ContentSchema], default: [] },
  },
}, {
  timestamps: true,
});

export default mongoose.models.Workshop || mongoose.model<IWorkshop>('Workshop', WorkshopSchema);