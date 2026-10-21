// Config de la app "Gastos". Comparte proyecto de Supabase con el resto
// de apps de este hosting; todo lo suyo usa el prefijo "gastos_" (tablas
// gastos_*, funciones gastos_*) y el bucket de Storage "gastos".
//
// La anon key es pública por diseño: las tablas no tienen políticas para
// anon y todo pasa por las funciones gastos_*, que exigen la clave que la
// app deriva de tu contraseña (nunca se guarda la contraseña en sí).
window.GASTOS_CONFIG = {
  url: "https://dzlhsdpgyxnjwudmrnul.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bGhzZHBneXhuand1ZG1ybnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MzEzMjgsImV4cCI6MjEwNTAwNzMyOH0.B572twWEEJjnNr1SZDrUCHBG9VgIEo9RXyZXyszjhrM",
  tablePrefix: "gastos_",
  bucket: "gastos",
};
