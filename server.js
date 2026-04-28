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
// RUTA PARA GUARDAR RESULTADOS DEL MÉDICO
app.post('/savePracticeResult', async (req, res) => {
  console.log("Recibida carga de resultado para DNI:", req.body.dni);
  try {
    // Llamada a Apps Script usando AXIOS como venías haciendo
    const response = await axios.post(APPS_SCRIPT_URL, {
      action: 'finalizarCargaPractica',
      payload: req.body
    });
    
    console.log("Respuesta de Google:", response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error al contactar Apps Script:', error.message);
    res.status(500).json({ success: false, message: 'Error de comunicación con Google.' });
  }
});
// --- Ruta para obtener prácticas guardadas (rápido, sin regenerar) ---
app.get('/getPracticasGuardadas/:dni', async (req, res) => {
  console.log(`Consulta de prácticas guardadas para DNI: ${req.params.dni}`);
  try {
    const response = await axios.post(APPS_SCRIPT_URL, {
      action: 'obtenerPracticasGuardadas',
      payload: { dni: req.params.dni }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error en /getPracticasGuardadas:', error.message);
    res.status(500).json({ success: false, message: 'Error al obtener prácticas.' });
  }
});
// --- Ruta para login de prestadores ---
app.post('/loginPrestador', async (req, res) => {
  try {
    const response = await axios.post(APPS_SCRIPT_URL, {
      action: 'loginPrestador',
      payload: { usuario: req.body.usuario, password: req.body.password }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error de conexión.' });
  }
});

// --- Ruta para obtener prácticas por especialidad ---
app.get('/getPracticasPrestador/:dni/:especialidad', async (req, res) => {
  try {
    const response = await axios.post(APPS_SCRIPT_URL, {
      action: 'getPracticasPrestador',
      payload: { 
        dni: req.params.dni, 
        especialidad: req.params.especialidad 
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error de conexión.' });
  }
});

// --- Ruta para generar planilla de facturación ---
app.get('/getFacturacion/:idPrestador/:mes/:anio', async (req, res) => {
  try {
    const response = await axios.post(APPS_SCRIPT_URL, {
      action: 'getFacturacion',
      payload: {
        idPrestador: req.params.idPrestador,
        mes: req.params.mes,
        anio: req.params.anio
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error de conexión.' });
  }
});
app.post('/marcarFacturadas', async (req, res) => {
  try {
    const response = await axios.post(APPS_SCRIPT_URL, {
      action: 'marcarComoFacturadas',
      payload: req.body
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error de conexión.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));