import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhoneNumber(value: string) {
  if (!value) return value;
  const phoneNumber = value.replace(/[^\d]/g, '');
  const phoneNumberLength = phoneNumber.length;
  if (phoneNumberLength < 4) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  }
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
}

export function getPropertyClassLabel(code: string | number): string {
  const codeStr = String(code).trim();
  const classes: Record<string, string> = {
    "0000": "Terreno Vacío",
    "0100": "Casa Unifamiliar",
    "01": "Casa Unifamiliar",
    "0200": "Casa Móvil",
    "02": "Casa Móvil",
    "0300": "Multifamiliar (>=10 unidades)",
    "0400": "Condominio",
    "04": "Condominio",
    "0500": "Cooperativa",
    "0800": "Multifamiliar (<10 unidades)",
    "08": "Multifamiliar (<10 unidades)",
    "1000": "Comercial Vacío",
    "1100": "Tienda",
    "1200": "Comercio Mixto",
    "1700": "Oficinas",
    "4100": "Industrial Ligero",
    "4800": "Almacenes/Bodegas",
    "7100": "Iglesia / Templo",
    "7200": "Escuela Privada",
    "7300": "Hospital Privado",
    "8000": "Propiedad del Gobierno",
    "8200": "Bosque / Parque",
  };

  return classes[codeStr] ? `${codeStr} - ${classes[codeStr]}` : codeStr;
}
