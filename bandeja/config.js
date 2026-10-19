// Config de la app "Bandeja". Comparte proyecto de Supabase con el resto
// de apps de este hosting; todo lo suyo usa el prefijo "bandeja_" (tabla
// bandeja_items, funciones bandeja_*) y el bucket de Storage "bandeja".
//
// La anon key es pública por diseño: la tabla no tiene políticas para
// anon y todo pasa por funciones que exigen la clave secreta de la sala,
// que solo viaja en el enlace (#k=...).
window.BANDEJA_CONFIG = {
  url: "https://dzlhsdpgyxnjwudmrnul.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bGhzZHBneXhuand1ZG1ybnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MzEzMjgsImV4cCI6MjEwNTAwNzMyOH0.B572twWEEJjnNr1SZDrUCHBG9VgIEo9RXyZXyszjhrM",
  tablePrefix: "bandeja_",
  bucket: "bandeja",
};
