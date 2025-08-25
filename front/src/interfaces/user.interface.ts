export interface IUser {
  _id: string;
  name: string;
  email?: string;
  isConnected?: boolean;
}

export interface IPrivateMessage {
  _id: string;
  from: string;
  to: string;
  text: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}
