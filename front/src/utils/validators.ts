// src/utils/validators.ts
export function sanitizeInput(value: string): string {
  return value
    .replace(/<[^>]*>?/gm, "") // Elimina etiquetas HTML
    .replace(/["'`;{}]/g, ""); // Elimina caracteres peligrosos
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 6; // Cambia la regla si quieres
}
