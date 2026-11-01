// Config de la app "Hucha". Comparte proyecto de Supabase con el resto de
// apps de este hosting; todas sus tablas/funciones usan el prefijo "hucha_".
//
// La anon key es pública (RLS): con ella solo se pueden LEER movimientos.
// Para meter, sacar o borrar dinero hay que llamar a las funciones
// hucha_movimiento / hucha_borrar, que comprueban el PIN del padre en el
// servidor (guardado como hash en hucha_ajustes, ilegible para anon).
window.HUCHA_CONFIG = {
  url: "https://dzlhsdpgyxnjwudmrnul.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bGhzZHBneXhuand1ZG1ybnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MzEzMjgsImV4cCI6MjEwNTAwNzMyOH0.B572twWEEJjnNr1SZDrUCHBG9VgIEo9RXyZXyszjhrM",
  tablePrefix: "hucha_",
  interesAnual: 0.10,      // 10 % anual, compuesto de forma continua
  anioNacimiento: 2014,
  inicioUniversidad: "2032-09-15",
};
