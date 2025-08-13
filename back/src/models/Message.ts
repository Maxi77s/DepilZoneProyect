import { Schema, model, Types } from "mongoose";
import { IMessage } from "../interfaces/message.interface";
const messageSchema = new Schema<IMessage>(
  {
    room: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const Message = model<IMessage>("Message", messageSchema);
