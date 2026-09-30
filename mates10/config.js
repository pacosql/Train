// Config de Mates10. Comparte proyecto de Supabase con el resto de apps del
// hosting Train; todas sus tablas y funciones llevan el prefijo "mates10_".
// La anon key es pública por diseño (protegida por RLS). Prototipo sin
// autenticación: ver DECISIONES.md, "Deuda".
window.MATES10_CONFIG = {
  url: "https://dzlhsdpgyxnjwudmrnul.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bGhzZHBneXhuand1ZG1ybnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MzEzMjgsImV4cCI6MjEwNTAwNzMyOH0.B572twWEEJjnNr1SZDrUCHBG9VgIEo9RXyZXyszjhrM",
  tablePrefix: "mates10_",
};
