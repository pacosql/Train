// Config de la app "Dieta". Comparte proyecto de Supabase con el resto de
// apps de este hosting; todas sus tablas usan el prefijo "dieta_" y las
// fotos van al bucket público "dieta-fotos".
// La anon key es pública por diseño y está protegida por RLS.
window.DIETA_CONFIG = {
  url: "https://dzlhsdpgyxnjwudmrnul.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bGhzZHBneXhuand1ZG1ybnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MzEzMjgsImV4cCI6MjEwNTAwNzMyOH0.B572twWEEJjnNr1SZDrUCHBG9VgIEo9RXyZXyszjhrM",
  tablePrefix: "dieta_",
  bucket: "dieta-fotos",
};
