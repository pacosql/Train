// Config de la app "Peluquería". Comparte proyecto de Supabase con el resto
// de apps de este hosting; todas sus tablas usan el prefijo "peluqueria_".
// Demo sin seguridad: la anon key (pública, RLS abierta) lee y escribe todo.
window.PELU_CONFIG = {
  url: "https://dzlhsdpgyxnjwudmrnul.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bGhzZHBneXhuand1ZG1ybnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MzEzMjgsImV4cCI6MjEwNTAwNzMyOH0.B572twWEEJjnNr1SZDrUCHBG9VgIEo9RXyZXyszjhrM",
  tablePrefix: "peluqueria_",
  diasVista: 14, // cuántos días por delante se pueden reservar
};
