// server.js
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors()); // permite fetch desde cualquier origen
app.use(express.json()); // necesario para POST desde admin

const PORT = process.env.PORT || 3000;

// ---- Licencias en memoria ----
let licencias = []; 
// cada licencia: { clave: "BERENE-XXXX-XXXX-SUBS", deviceIDs: [], activa: true }

// ---- Generar nueva licencia ----
function generarLicencia() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  function parte(n) {
    let s = "";
    for (let i = 0; i < n; i++) {
      s += chars[Math.floor(Math.random() * chars.length)];
    }
    return s;
  }
  return `BERENE-${parte(4)}-${parte(4)}-SUBS`;
}

// --------------------
// ----- GET para TurboWarp / Scratch -----
// --------------------

// Crear licencia (GET)
app.get("/crear", (req, res) => {
  const nueva = { clave: generarLicencia(), deviceIDs: [], activa: true };
  licencias.push(nueva);
  res.json({ success: true, licencia: nueva.clave });
});

// Validar licencia (GET)
app.get("/validar", (req, res) => {
  const { clave, deviceID } = req.query;
  if (!clave || !deviceID) return res.json({ valida: false, error: "Falta clave o deviceID" });

  const licencia = licencias.find(l => l.clave === clave && l.activa);
  if (!licencia) return res.json({ valida: false });

  // registrar deviceID si no existe
  if (!licencia.deviceIDs.includes(deviceID)) {
    licencia.deviceIDs.push(deviceID);
  }

  res.json({ valida: true, clave, deviceID });
});

// Cancelar licencia (GET)
app.get("/cancelar", (req, res) => {
  const { clave } = req.query;
  const licencia = licencias.find(l => l.clave === clave);
  if (!licencia) return res.json({ success: false });
  licencia.activa = false;
  res.json({ success: true });
});

// Listar licencias (GET) - solo info mínima
app.get("/licencias", (req, res) => {
  const lista = licencias.map(l => ({ clave: l.clave, activa: l.activa, dispositivos: l.deviceIDs.length }));
  res.json({ success: true, licencias: lista });
});

// --------------------
// ----- POST para HTML Admin -----
// --------------------

// Crear licencia
app.post("/crear", (req, res) => {
  const nueva = { clave: generarLicencia(), deviceIDs: [], activa: true };
  licencias.push(nueva);
  res.json({ success: true, licencia: nueva.clave });
});

// Validar licencia
app.post("/validar", (req, res) => {
  const { clave, deviceID } = req.body;
  if (!clave || !deviceID) return res.json({ valida: false, error: "Falta clave o deviceID" });

  const licencia = licencias.find(l => l.clave === clave && l.activa);
  if (!licencia) return res.json({ valida: false });

  if (!licencia.deviceIDs.includes(deviceID)) {
    licencia.deviceIDs.push(deviceID);
  }

  res.json({ valida: true, clave, deviceID });
});

// Cancelar licencia
app.post("/cancelar", (req, res) => {
  const { clave } = req.body;
  const licencia = licencias.find(l => l.clave === clave);
  if (!licencia) return res.json({ success: false });
  licencia.activa = false;
  res.json({ success: true });
});

// Listar licencias (POST)
app.post("/licencias", (req, res) => {
  const lista = licencias.map(l => ({ clave: l.clave, activa: l.activa, dispositivos: l.deviceIDs.length }));
  res.json({ success: true, licencias: lista });
});

// --------------------
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
