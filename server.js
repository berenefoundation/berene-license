// ------------------- IMPORTS -------------------
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

// ------------------- CONFIG -------------------
const app = express();
app.use(cors()); // permitir fetch desde TurboWarp
app.use(express.json()); // para leer JSON en POST

// ------------------- MONGO ATLAS -------------------
const uri = process.env.MONGO_URI; // tu URI de MongoDB Atlas
const client = new MongoClient(uri);
let coleccionLicencias;

async function conectarMongo() {
  await client.connect();
  const db = client.db("BereneLicense"); // nombre de tu DB
  coleccionLicencias = db.collection("licencias"); // colección de licencias
  console.log("Conectado a MongoDB Atlas ✅");
}
conectarMongo();

// ------------------- FUNCIONES AUX -------------------

// Genera clave tipo BERENE-XXXX-XXXX-SUBS
function generarClave() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  function bloque(n) {
    let res = "";
    for (let i = 0; i < n; i++) {
      res += chars[Math.floor(Math.random() * chars.length)];
    }
    return res;
  }
  return `BERENE-${bloque(4)}-${bloque(4)}-SUBS`;
}

// ------------------- ENDPOINTS -------------------

// Crear nueva licencia (desde HTML admin)
app.post("/crear", async (req, res) => {
  const nuevaLicencia = {
    clave: generarClave(),
    activa: true,
    deviceIDs: []
  };
  await coleccionLicencias.insertOne(nuevaLicencia);
  res.json({ licencia: nuevaLicencia.clave });
});

// Listar todas las licencias (HTML admin)
app.get("/licencias", async (req, res) => {
  const todas = await coleccionLicencias.find().toArray();
  res.json(todas);
});

// Validar licencia (GET desde TurboWarp)
app.get("/validar", async (req, res) => {
  const { clave, deviceID } = req.query;
  const licencia = await coleccionLicencias.findOne({ clave, activa: true });
  if (!licencia) return res.json({ valida: false });

  // Registrar deviceID si no estaba
  if (!licencia.deviceIDs.includes(deviceID)) {
    licencia.deviceIDs.push(deviceID);
    await coleccionLicencias.updateOne(
      { clave },
      { $set: { deviceIDs: licencia.deviceIDs } }
    );
  }

  res.json({ valida: true, clave, deviceID });
});

// Cancelar licencia (desde HTML admin)
app.post("/cancelar", async (req, res) => {
  const { clave } = req.body;
  await coleccionLicencias.updateOne(
    { clave },
    { $set: { activa: false } }
  );
  res.json({ cancelada: clave });
});

// ------------------- INICIAR SERVIDOR -------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT} 🚀`);
});
