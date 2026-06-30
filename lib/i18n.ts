// Simple i18n system
export const translations = {
  es: {
    roles: {
      ADMIN: "Administrador",
      SETTER: "Setter",
      CLOSER: "Closer",
    },
    nav: {
      map: "Mapa",
      dashboard: "Dashboard",
      calendar: "Calendario",
      ranking: "Ranking",
      chat: "Chat",
      admin: "Admin",
    },
    login: {
      title: "Iniciar Sesión",
      email: "Correo electrónico",
      password: "Contraseña",
      submit: "Ingresar",
      error: "Credenciales inválidas",
    },
    common: {
      loading: "Cargando...",
      error: "Error",
      success: "Éxito",
      cancel: "Cancelar",
      save: "Guardar",
      delete: "Eliminar",
      edit: "Editar",
      close: "Cerrar",
    },
  },
  en: {
    roles: {
      ADMIN: "Administrator",
      SETTER: "Setter",
      CLOSER: "Closer",
    },
    nav: {
      map: "Map",
      dashboard: "Dashboard",
      calendar: "Calendar",
      ranking: "Ranking",
      chat: "Chat",
      admin: "Admin",
    },
    login: {
      title: "Login",
      email: "Email",
      password: "Password",
      submit: "Sign In",
      error: "Invalid credentials",
    },
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      close: "Close",
    },
  },
};

export type Locale = keyof typeof translations;
export type TranslationKeys = typeof translations.es;

export function getTranslation(locale: Locale = "es") {
  return translations[locale] || translations.es;
}
