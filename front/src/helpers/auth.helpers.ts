// src/helpers/auth.helpers.ts
import { login as loginService, register as registerService } from "../services/auth.service";
import { sanitizeInput, isValidEmail, isStrongPassword } from "../utils/validators";

export type AuthUser = { id: string; name: string; email: string };
export type AuthResponse = { token: string; user: AuthUser };

type ErrorResponseData = { message?: string; error?: string };

function toAppError(err: unknown): Error {
  const e = err as { response?: { data?: unknown }; message?: string };
  let msg: string;
  const data = e?.response?.data;
  if (data && typeof data === "object") {
    const errorData = data as ErrorResponseData;
    if ("message" in errorData && typeof errorData.message === "string") {
      msg = errorData.message;
    } else if ("error" in errorData && typeof errorData.error === "string") {
      msg = errorData.error;
    } else {
      msg = e?.message || "Ocurrió un error. Intenta nuevamente.";
    }
  } else {
    msg = e?.message || "Ocurrió un error. Intenta nuevamente.";
  }
  return new Error(msg);
}

export async function loginHelper(email: string, password: string): Promise<AuthResponse> {
  const cleanEmail = sanitizeInput(email);
  const cleanPassword = sanitizeInput(password);

  if (!isValidEmail(cleanEmail)) throw new Error("Correo inválido");
  if (!cleanPassword) throw new Error("Contraseña requerida");

  try {
    const { data } = await loginService(cleanEmail, cleanPassword);
    if (data?.token) localStorage.setItem("token", data.token);
    return data as AuthResponse;
  } catch (err) {
    throw toAppError(err);
  }
}

/* opcional: dejamos también el helper de register por consistencia */
export async function registerHelper(name: string, email: string, password: string): Promise<AuthResponse> {
  const cleanName = sanitizeInput(name);
  const cleanEmail = sanitizeInput(email);
  const cleanPassword = sanitizeInput(password);

  if (!cleanName) throw new Error("Nombre requerido");
  if (!isValidEmail(cleanEmail)) throw new Error("Correo inválido");
  if (!isStrongPassword(cleanPassword)) throw new Error("La contraseña es muy débil");

  try {
    const { data } = await registerService(cleanName, cleanEmail, cleanPassword);
    if (data?.token) localStorage.setItem("token", data.token);
    return data as AuthResponse;
  } catch (err) {
    throw toAppError(err);
  }
}
