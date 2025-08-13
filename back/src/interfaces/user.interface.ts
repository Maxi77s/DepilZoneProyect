import { Types } from "mongoose";

export interface IUser {
  email: string;
  name: string;
  passwordHash: string;
  avatarUrl?: string; // opcional
}
