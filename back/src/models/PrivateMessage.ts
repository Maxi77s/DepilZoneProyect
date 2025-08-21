// src/models/PrivateMessage.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IPrivateMessage extends Document {
  from: mongoose.Types.ObjectId;
  to: mongoose.Types.ObjectId;
  text: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PrivateMessageSchema = new Schema<IPrivateMessage>(
  {
    from: { type: Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const PrivateMessage = mongoose.model<IPrivateMessage>(
  "PrivateMessage",
  PrivateMessageSchema
);
