// Config de la app "Pistas". Comparte proyecto de Supabase con el resto
// de apps de este hosting, pero todas sus tablas usan el prefijo
// "pistas_" para no chocar con las de otras apps del mismo proyecto.
//
// La "anon key" es pública por diseño (se usa en el cliente) y está
// protegida por las políticas de Row Level Security (RLS) de cada tabla,
// así que no pasa nada por dejarla aquí, en un repo público incluso.
window.PISTAS_CONFIG = {
  url: "https://dzlhsdpgyxnjwudmrnul.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bGhzZHBneXhuand1ZG1ybnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MzEzMjgsImV4cCI6MjEwNTAwNzMyOH0.B572twWEEJjnNr1SZDrUCHBG9VgIEo9RXyZXyszjhrM",
  tablePrefix: "pistas_",
};
