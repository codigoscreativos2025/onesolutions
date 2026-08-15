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
  // Aseguramos que el código tenga al menos 4 dígitos rellenando con ceros si es necesario.
  const codeStr = String(code).trim().padStart(4, '0');
  
  // Diccionario principal con las clases base de 2 dígitos del Florida Department of Revenue (DOR)
  const classes: Record<string, string> = {
    "00": "Terreno Vacío",
    "01": "Casa Unifamiliar",
    "02": "Casa Móvil",
    "03": "Multifamiliar (>=10 unidades)",
    "04": "Condominio",
    "05": "Cooperativa",
    "06": "Residencia de Retiro / Asilo",
    "07": "Misceláneo Residencial",
    "08": "Multifamiliar (<10 unidades)",
    "09": "Elementos Comunes Residenciales",
    "10": "Terreno Vacío Comercial",
    "11": "Tienda",
    "12": "Comercio Mixto",
    "13": "Tienda por Departamentos",
    "14": "Supermercado",
    "15": "Centro Comercial Regional",
    "16": "Centro Comercial Comunitario",
    "17": "Oficinas (1 piso)",
    "18": "Oficinas (Multi-piso)",
    "19": "Servicios Profesionales",
    "20": "Aeropuertos / Terminales",
    "21": "Restaurantes / Cafeterías",
    "23": "Bancos / Entidades Financieras",
    "25": "Talleres Mecánicos",
    "26": "Gasolinera",
    "27": "Estacionamiento",
    "28": "Concesionario de Autos",
    "39": "Hotel / Motel",
    "40": "Terreno Vacío Industrial",
    "41": "Industrial Ligero",
    "42": "Industrial Pesado",
    "48": "Almacenes / Bodegas",
    "70": "Terreno Vacío Institucional",
    "71": "Iglesia / Templo",
    "72": "Escuela Privada",
    "73": "Hospital Privado",
    "80": "Propiedad del Gobierno",
    "82": "Bosque / Parque Público",
    "86": "Condado / Ciudad",
    "89": "Municipal",
  };

  // Primero intentamos buscar el código exacto por si tuviéramos mapeos específicos de 4 dígitos
  const exactMatch = classes[codeStr];
  if (exactMatch) {
    return `${codeStr} - ${exactMatch}`;
  }

  // Fallback: Tomamos los primeros 2 dígitos que representan la categoría general en el estándar de Florida DOR
  const baseCode = codeStr.substring(0, 2);
  const baseMatch = classes[baseCode];
  if (baseMatch) {
    return `${codeStr} - ${baseMatch}`;
  }

  // Si no se encuentra, devolvemos el código original
  return codeStr;
}
