"""Deja una fila en nombremates_rutina_log con un texto libre (para que la
rutina explique qué pasó aunque no llegue a cribar nada).

    python3 nombremates/tools/log.py --modelo claude-fable-5-1 "contexto.py falló: <error literal>"
"""
import json, sys, urllib.request
URL = "https://dzlhsdpgyxnjwudmrnul.supabase.co/rest/v1/nombremates_rutina_log"
ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bGhzZHBneXhuand1ZG1ybnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MzEzMjgsImV4cCI6MjEwNTAwNzMyOH0.B572twWEEJjnNr1SZDrUCHBG9VgIEo9RXyZXyszjhrM"
args = sys.argv[1:]
modelo = ""
if args and args[0] == "--modelo": modelo, args = args[1], args[2:]
texto = " ".join(args).strip() or "(sin texto)"
req = urllib.request.Request(URL, data=json.dumps([{"modelo": modelo, "resumen": texto[:2000]}]).encode(), method="POST",
                             headers={"apikey": ANON, "Authorization": "Bearer " + ANON, "Content-Type": "application/json", "Prefer": "return=minimal"})
urllib.request.urlopen(req, timeout=30)
print("registrado")
