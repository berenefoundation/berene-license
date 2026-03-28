const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json());

// 🔐 SECRETO (NO LO CAMBIES EN PRODUCCIÓN)
const SECRET = "BERENE_SECRET_2026";


// 🧠 Base de datos en memoria
let licencias = {};

// 🔤 Caracteres permitidos
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// 🔢 Generar bloque tipo XXXX (letras + números)
function generarBloque() {
    let resultado = "";
    for (let i = 0; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * CHARS.length);
        resultado += CHARS[randomIndex];
    }
    return resultado;
}

// 🔑 Generar licencia: BERENE-XXXX-XXXX-SUBS
function generarLicencia() {
    const parte1 = generarBloque();
    const parte2 = generarBloque();

    return `BERENE-${parte1}-${parte2}-SUBS`;
}

// 🔍 Validar formato
function validarFormato(clave) {
    const regex = /^BERENE-[A-Z0-9]{4}-[A-Z0-9]{4}-SUBS$/;
    return regex.test(clave);
}

// 📡 Crear licencia
app.post("/crear", (req, res) => {
    const clave = generarLicencia();

    licencias[clave] = {
        activa: true,
        dispositivos: 2,
        usados: []
    };

    res.json({ clave });
});

// 📡 Validar licencia
app.post("/validar", (req, res) => {
    const { clave, deviceID } = req.body;

    // ❌ Formato inválido
    if (!validarFormato(clave)) {
        return res.json({ valido: false, razon: "formato invalido" });
    }

    const lic = licencias[clave];

    // ❌ No existe o cancelada
    if (!lic || !lic.activa) {
        return res.json({ valido: false });
    }

    // 📱 Control de dispositivos
    if (deviceID) {
        if (!lic.usados.includes(deviceID)) {
            if (lic.usados.length >= lic.dispositivos) {
                return res.json({ valido: false, razon: "limite dispositivos" });
            }
            lic.usados.push(deviceID);
        }
    }

    res.json({ valido: true });
});

// ❌ Cancelar licencia
app.post("/cancelar", (req, res) => {
    const { clave } = req.body;

    if (licencias[clave]) {
        licencias[clave].activa = false;
        return res.json({ ok: true });
    }

    res.json({ ok: false });
});

// 📋 Ver todas las licencias
app.get("/licencias", (req, res) => {
    res.json(licencias);
});

// 🚀 Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor listo"));
