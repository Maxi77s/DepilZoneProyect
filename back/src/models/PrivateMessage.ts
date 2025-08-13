import mongoose, { Schema, Document } from "mongoose";

export interface IPrivateMessage extends Document {
  from: mongoose.Types.ObjectId;
  to: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
  read: boolean;
}

const PrivateMessageSchema = new Schema<IPrivateMessage>(
  {
    from: { type: Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    read: { type: Boolean, default: false } // 🔹 Nuevo campo
  },
  { timestamps: true }
);

export const PrivateMessage = mongoose.model<IPrivateMessage>(
  "PrivateMessage",
  PrivateMessageSchema
);
