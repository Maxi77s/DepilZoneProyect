import { api } from "../services/api";
import type { IUser } from "../interfaces/user.interface";

export async function getAllUsersHelper(): Promise<IUser[]> {
  try {
    const { data } = await api.get<IUser[]>("/users");
    return data;
  } catch (err: unknown) {
    // Mensaje útil desde backend o genérico
    let msg = "Error al obtener usuarios";
    if (typeof err === "object" && err !== null) {
      const response = (err as { response?: { data?: { message?: string; error?: string } } }).response;
      msg =
        response?.data?.message ??
        response?.data?.error ??
        (err as { message?: string }).message ??
        "Error al obtener usuarios";
    }
    throw new Error(msg);
  }
}
