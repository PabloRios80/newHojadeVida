require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(express.json());

// Sirve los archivos estáticos (tu index.html, form.js, styles.css, etc.)
app.use(express.static(path.join(__dirname, 'public'))); // Asumiendo que tus archivos están en una carpeta 'public'

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

// Ruta para guardar los datos de la Hoja de Vida
app.post('/saveData', async (req, res) => {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'guardarHojaDeVida', payload: req.body })
    });
    const data = await response.json();
    console.log("Respuesta recibida de Apps Script:", data);
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Ruta para obtener las recomendaciones
app.get('/getPreventivePlan/:dni', async (req, res) => {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'generarPlanPreventivo', payload: { dni: req.params.dni } })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Ruta para verificar un DNI
app.post('/checkDNI', async (req, res) => {
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'checkDNI', payload: { dni: req.body.dni } })
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ exists: false });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));