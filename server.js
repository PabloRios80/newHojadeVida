require('dotenv').config();
const express = require('express');
const axios = require('axios'); // La herramienta correcta que sí tenemos instalada
const path = require('path');

const app = express();
// Aumentamos el límite a 50MB para que entren los PDFs sin problemas
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Sirve los archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

// --- Ruta para guardar datos (CORREGIDA CON AXIOS) ---
app.post('/saveData', async (req, res) => {
  console.log("Recibida petición en /saveData. Enviando a Apps Script...");
  try {
    const response = await axios.post(APPS_SCRIPT_URL, {
      action: 'guardarHojaDeVida',
      payload: req.body
    });
    console.log("Respuesta de Apps Script (guardar):", response.data);
    res.json(response.data);
  } catch (error) {
    const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error('Error en /saveData:', errorMessage);
    res.status(500).json({ success: false, message: 'Error al contactar la API de guardado.' });
  }
});

// --- Ruta para obtener recomendaciones (CORREGIDA CON AXIOS) ---
app.get('/getPreventivePlan/:dni', async (req, res) => {
  console.log(`Recibida petición en /getPreventivePlan para DNI: ${req.params.dni}`);
  try {
    const response = await axios.post(APPS_SCRIPT_URL, {
      action: 'generarPlanPreventivo',
      payload: { dni: req.params.dni }
    });
    console.log("Respuesta de Apps Script (recomendar):", response.data);
    res.json(response.data);
  } catch (error) {
    const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error('Error en /getPreventivePlan:', errorMessage);
    res.status(500).json({ success: false, message: 'Error al generar el plan.' });
  }
});

// --- Ruta para verificar DNI (CORREGIDA CON AXIOS) ---
app.post('/checkDNI', async (req, res) => {
    try {
        const response = await axios.post(APPS_SCRIPT_URL, {
            action: 'checkDNI',
            payload: { dni: req.body.dni }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error en /checkDNI:', error.response ? error.response.data : error.message);
        res.status(500).json({ exists: false });
    }
});

// --- Nueva ruta para que el Prestador busque prácticas pendientes ---
app.get('/getPendingPractices/:dni', async (req, res) => {
  console.log(`Consulta de Prestador para DNI: ${req.params.dni}`);
  try {
    const response = await axios.post(APPS_SCRIPT_URL, {
      action: 'buscarPendientesPrestador', // Esta es la nueva acción
      payload: { dni: req.params.dni }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error en /getPendingPractices:', error.message);
    res.status(500).json({ success: false, message: 'Error al buscar prácticas.' });
  }
});
app.post('/savePracticeResult', async (req, res) => {
  try {
    const response = await axios.post(APPS_SCRIPT_URL, {
      action: 'finalizarCargaPractica',
      payload: req.body
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al guardar el resultado.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));