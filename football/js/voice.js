// Grabadora de comentarios por voz para 🔧 Revisar.
//
// Graba el audio con MediaRecorder y, a la vez, intenta transcribirlo con
// el reconocimiento de voz del navegador (Chrome/Android y Safari lo
// tienen; si no está o falla, se queda solo el audio). La transcripción
// importa: el agente que mejora los ejercicios lee texto, no escucha audio.
// Es el mismo planteamiento que ya funciona en la app Negocios.
const SR = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition || null : null;

export const canRecord = () => !!(navigator.mediaDevices && window.MediaRecorder);
export const canTranscribe = () => !!SR;

function pickMime() {
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus", "audio/ogg"]) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return "";
}

// onText(textoFinalAcumulado, textoProvisional) se llama mientras hablas.
// Devuelve { stop(): Promise<{blob, mime, seconds, text}>, cancel() }.
export async function startRecording({ onText } = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = pickMime();
  const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks = [];
  recorder.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data);
  const startedAt = Date.now();
  recorder.start(1000);

  const finals = [];
  let sr = null;
  let live = true;
  if (SR) {
    const begin = () => {
      try {
        sr = new SR();
        sr.lang = "es-ES";
        sr.continuous = true;
        sr.interimResults = true;
        sr.onresult = (e) => {
          let interim = "";
          for (let k = e.resultIndex; k < e.results.length; k++) {
            const t = e.results[k][0].transcript;
            if (e.results[k].isFinal) finals.push(t.trim());
            else interim += t;
          }
          onText && onText(finals.join(" "), interim);
        };
        sr.onerror = () => {};
        // El reconocimiento se corta solo tras un silencio: se rearranca
        // mientras siga la grabación.
        sr.onend = () => live && begin();
        sr.start();
      } catch (_) {
        sr = null;
      }
    };
    begin();
  }

  const finish = () => {
    live = false;
    if (sr) {
      try {
        sr.stop();
      } catch (_) {}
      sr = null;
    }
  };

  return {
    startedAt,
    stop: () =>
      new Promise((resolve) => {
        finish();
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const type = recorder.mimeType || mime || "audio/webm";
          resolve({
            blob: new Blob(chunks, { type }),
            mime: type,
            seconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
            text: finals.join(" ").trim(),
          });
        };
        if (recorder.state !== "inactive") recorder.stop();
        else recorder.onstop();
      }),
    cancel: () => {
      finish();
      try {
        if (recorder.state !== "inactive") recorder.stop();
      } catch (_) {}
      stream.getTracks().forEach((t) => t.stop());
    },
  };
}
