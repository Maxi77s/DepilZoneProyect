import { Schema, model } from "mongoose";
import { IRoom } from "../interfaces/room.interface";

const roomSchema = new Schema<IRoom>(
  {
    name: { type: String, required: true, trim: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

export const Room = model<IRoom>("Room", roomSchema);
