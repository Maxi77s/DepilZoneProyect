import { Types } from "mongoose";

export interface IRoom {
  name: string;
  participants: Types.ObjectId[];
}
