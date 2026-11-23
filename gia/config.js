// Config de la app "GIA" (entrenador del test Thomas GIA para Canonical).
// Comparte proyecto de Supabase con el resto de apps de este hosting; todas
// sus tablas usan el prefijo "gia_". La anon key es pública (RLS): puede
// leer todo e insertar sesiones; el plan y el banco de palabras solo los
// escribe la rutina horaria (Management API).
window.GIA_CONFIG = {
  url: "https://dzlhsdpgyxnjwudmrnul.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bGhzZHBneXhuand1ZG1ybnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MzEzMjgsImV4cCI6MjEwNTAwNzMyOH0.B572twWEEJjnNr1SZDrUCHBG9VgIEo9RXyZXyszjhrM",
  tablePrefix: "gia_",
};
