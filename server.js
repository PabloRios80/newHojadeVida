require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);
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
app.get('/getPreventivePlan/:dni', async (req, res) => {
  const dni = req.params.dni;
  console.log(`Generando plan preventivo para DNI: ${dni}`);

  try {
    // 1. Buscar datos del afiliado en Supabase
    const { data: afiliado, error: errorAfiliado } = await supabase
      .from('afiliados')
      .select('*')
      .eq('dni', dni)
      .single();

    if (errorAfiliado || !afiliado) {
      return res.json({ success: false, message: 'Afiliado no encontrado.' });
    }

    // 2. Buscar historial de días preventivos anteriores
    const { data: historial } = await supabase
      .from('historial_dia_preventivo')
      .select('*')
      .eq('dni', dni)
      .order('fechax', { ascending: false });

    // 3. Buscar prácticas históricas anteriores
    const { data: practicasHistoricas } = await supabase
      .from('practicas_historicas')
      .select('*')
      .eq('dni', dni)
      .order('fecha', { ascending: false });

    // 4. Buscar prácticas ya autorizadas para no duplicar
    const { data: practicasYaAutorizadas } = await supabase
      .from('practicas_autorizadas')
      .select('*')
      .eq('dni', dni)
      .in('estado', ['AUTORIZADA', 'REALIZADA']);

    // 5. Leer reglas preventivas
    const { data: reglas } = await supabase
      .from('reglas_preventivas')
      .select('*');

    // 6. Correr el algoritmo
    const practicasAutorizar = evaluarReglas(
      afiliado, 
      historial || [], 
      practicasHistoricas || [], 
      practicasYaAutorizadas || [],
      reglas || []
    );

    if (practicasAutorizar.length === 0) {
      return res.json({ success: true, message: 'El afiliado está al día con todas sus prácticas.', autorizadas: 0 });
    }

    // 7. Insertar prácticas autorizadas en Supabase
    const nombreCompleto = `${afiliado.apellido || ''} ${afiliado.nombre || ''}`.trim();
    const nuevasPracticas = practicasAutorizar.map(p => ({
      dni: dni,
      nombre_completo: nombreCompleto,
      descripcion_practica: p.practica,
      codigo_prestacion: p.codigo || null,
      estado: 'AUTORIZADA',
      fecha_autorizacion: new Date().toISOString()
    }));

    const { error: errorInsert } = await supabase
      .from('practicas_autorizadas')
      .insert(nuevasPracticas);

    if (errorInsert) {
      console.error('Error insertando prácticas:', errorInsert);
      return res.status(500).json({ success: false, message: 'Error al guardar prácticas.' });
    }

    console.log(`✅ ${nuevasPracticas.length} prácticas autorizadas para DNI ${dni}`);
    res.json({ success: true, autorizadas: nuevasPracticas.length, practicas: nuevasPracticas });

  } catch (error) {
    console.error('Error en /getPreventivePlan:', error.message);
    res.status(500).json({ success: false, message: 'Error al generar el plan.' });
  }
});

// ==========================================
// ALGORITMO PRINCIPAL
// ==========================================
function evaluarReglas(afiliado, historial, practicasHistoricas, practicasYaAutorizadas, reglas) {
  const hoy = new Date();
  const practicasAutorizar = [];

  // Último día preventivo
  const ultimoDP = historial.length > 0 ? historial[0] : null;

  // Set de prácticas ya autorizadas o realizadas para evitar duplicados
  const yaAutorizadas = new Set(
    practicasYaAutorizadas.map(p => p.descripcion_practica.toLowerCase().trim())
  );

  for (const regla of reglas) {
    // ── VERIFICAR EDAD ──────────────────────────────
    const edad = parseInt(afiliado.edad) || 0;
    if (regla.edad_desde && edad < regla.edad_desde) continue;
    if (regla.edad_hasta && edad > regla.edad_hasta) continue;

    // ── VERIFICAR SEXO ──────────────────────────────
    if (regla.sexo_aplica && regla.sexo_aplica !== 'ambos') {
      const sexo = (afiliado.sexo_biologico || '').toLowerCase();
      if (regla.sexo_aplica === 'femenino' && !sexo.includes('fem')) continue;
      if (regla.sexo_aplica === 'masculino' && !sexo.includes('mas')) continue;
    }

    // ── VERIFICAR CONDICIÓN EN HOJA DE VIDA ────────
    if (regla.condicion_campo && regla.condicion_valor) {
      const valorAfiliado = (afiliado[regla.condicion_campo] || '').toString().toLowerCase();
      const valoresAceptados = regla.condicion_valor.toLowerCase().split(',').map(v => v.trim());
      if (!valoresAceptados.some(v => valorAfiliado.includes(v))) continue;
    }

    // ── VERIFICAR EXCLUSIÓN POR HISTORIAL ──────────
    if (regla.excluir_si_historial_es && ultimoDP) {
      const campoHistorial = mapearCampoHistorial(regla.historial_condicion_campo);
      if (campoHistorial) {
        const valorHistorial = (ultimoDP[campoHistorial] || '').toLowerCase();
        if (valorHistorial.includes(regla.excluir_si_historial_es.toLowerCase())) continue;
      }
    }

    // ── VERIFICAR CONDICIÓN EN HISTORIAL ───────────
    if (regla.historial_condicion_campo && regla.historial_condicion_valor) {
      const campoHistorial = mapearCampoHistorial(regla.historial_condicion_campo);
      if (campoHistorial && ultimoDP) {
        const valorHistorial = (ultimoDP[campoHistorial] || '').toLowerCase();
        const valoresRequeridos = regla.historial_condicion_valor.toLowerCase().split(',').map(v => v.trim());
        if (!valoresRequeridos.some(v => valorHistorial.includes(v))) continue;
      }
    }

    // ── VERIFICAR FRECUENCIA ────────────────────────
    if (regla.frecuencia_anios && regla.frecuencia_anios > 0) {
      const ultimaRealizacion = buscarUltimaRealizacion(
        regla.practica, 
        practicasHistoricas, 
        historial
      );
      if (ultimaRealizacion) {
        const diasDesdeUltima = (hoy - new Date(ultimaRealizacion)) / (1000 * 60 * 60 * 24);
        const diasRequeridos = regla.frecuencia_anios * 365;
        if (diasDesdeUltima < diasRequeridos) continue;
      }
    }

    // ── EVITAR DUPLICADOS ──────────────────────────
    const practicaNorm = regla.practica.toLowerCase().trim();
    if (yaAutorizadas.has(practicaNorm)) continue;

    // ── AUTORIZAR ──────────────────────────────────
    practicasAutorizar.push({ practica: regla.practica });
    yaAutorizadas.add(practicaNorm);
  }

  return practicasAutorizar;
}

// Mapea nombres de columnas del historial a nombres en Supabase
function mapearCampoHistorial(campo) {
  if (!campo) return null;
  const MAPA = {
    'Cáncer cérvico uterino - HPV': 'cancer_cervico_hpv',
    'Cáncer cérvico uterino - PAP': 'cancer_cervico_pap',
    'SOMF': 'somf',
    'VIH': 'vih',
    'Hepatitis B': 'hepatitis_b',
    'Hepatitis C': 'hepatitis_c',
    'Chagas': 'chagas',
    'Dislipemias': 'dislipemias',
    'Diabetes': 'diabetes',
    'Presión Arterial': 'presion_arterial',
  };
  return MAPA[campo] || null;
}

// Busca la última vez que se realizó una práctica en ambas fuentes
function buscarUltimaRealizacion(practica, practicasHistoricas, historial) {
  const practicaNorm = practica.toLowerCase();
  
  // Buscar en practicas_historicas
  const MAPA_TIPO = {
    'mamografia': 'mamografia',
    'ecografia mamaria': 'eco_mamaria',
    'papanicolau': 'papanicolau',
    'test hpv': 'papanicolau',
    'densitometria osea': 'densitometria',
    'videocolonoscopia': 'vcc',
    'sangre oculta en materia fecal': 'laboratorio',
  };

  let tipoPractica = null;
  for (const [key, value] of Object.entries(MAPA_TIPO)) {
    if (practicaNorm.includes(key)) {
      tipoPractica = value;
      break;
    }
  }

  if (tipoPractica) {
    const encontrada = practicasHistoricas.find(p => 
      p.tipo_practica === tipoPractica && p.fecha
    );
    if (encontrada) return encontrada.fecha;
  }

  // Buscar en historial_dia_preventivo
  const MAPA_HISTORIAL = {
    'mamografia': 'cancer_mama_mamografia',
    'ecografia mamaria': 'cancer_mama_eco_mamaria',
    'papanicolau': 'cancer_cervico_pap',
    'test hpv': 'cancer_cervico_hpv',
    'glucemia': 'dislipemias',
    'somf': 'somf',
    'psa': 'prostata_psa',
    'densitometria': 'osteoporosis',
    'colonoscopia': 'cancer_colon_colonoscopia',
  };

  for (const [key, campo] of Object.entries(MAPA_HISTORIAL)) {
    if (practicaNorm.includes(key)) {
      const encontrado = historial.find(h => 
        h[campo] && 
        !['no se realiza', 'no aplica', 'pendiente'].includes(h[campo].toLowerCase())
      );
      if (encontrado) return encontrado.fechax;
      break;
    }
  }

  return null;
}

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
  const { dni, especialidad } = req.params;

  const PRACTICAS_POR_ESPECIALIDAD = {
    'Laboratorio Bioquimico': [
      'glucemia', 'colesterol', 'creatinina', 'filtrado', 'trigliceridos',
      'VIH', 'anti_VIH', 'hepatitis', 'chagas', 'VDRL', 'PSA', 'HPV',
      'hemoglobina', 'microalbuminuria', 'proteinuria', 'clearence', 'SOMF'
    ],
    'Diagnostico por Imagenes': [
      'mamografia', 'ecografia', 'densitometria', 'aorta'
    ],
    'Gastroenterologia': ['colonoscopia', 'VCC'],
    'Medicina': ['TA', 'IMC', 'espirometria', 'PAP', 'HPV', 'consejeria', 'vision'],
    'Odontologia': ['odontologico', 'dental'],
    'Prestador PPDT': ['vacunas']
  };

  try {
    const keywords = PRACTICAS_POR_ESPECIALIDAD[especialidad] || [];
    
    const { data, error } = await supabase
      .from('practicas_autorizadas')
      .select('*')
      .eq('dni', dni)
      .or(keywords.map(k => `descripcion_practica.ilike.%${k}%`).join(','));

    if (error) throw error;

    // Buscamos nombre del afiliado
    const { data: afiliado } = await supabase
      .from('afiliados')
      .select('nombre, apellido')
      .eq('dni', dni)
      .single();

    const practicasConNombre = (data || []).map(p => ({
      ...p,
      nombre_completo: afiliado ? `${afiliado.apellido} ${afiliado.nombre}` : p.nombre_completo
    }));

    res.json({ success: true, practicas: practicasConNombre });

  } catch (error) {
    console.error('Error en /getPracticasPrestador:', error.message);
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
// --- Ruta para leer PDF de laboratorio con Gemini ---
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/leerPDFLaboratorio', async (req, res) => {
  try {
    const { pdfBase64, dni, nombre, apellido } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Analizá este informe de laboratorio y extraé los resultados en formato JSON.
    
Los campos que necesito son exactamente estos (si no encontrás el valor dejá null):
{
  "glucemia": "",
  "creatinina": "",
  "indice_filtrado_glomerular": "",
  "colesterol_total": "",
  "colesterol_hdl": "",
  "colesterol_ldl": "",
  "trigliceridos": "",
  "hiv": "",
  "hepatitis_b_antigeno_superficie": "",
  "hepatitis_b_anti_core": "",
  "hepatitis_c": "",
  "vdrl": "",
  "psa": "",
  "chagas_hai": "",
  "chagas_eclia": "",
  "hemoglobina_glicosilada": "",
  "microalbuminuria": "",
  "proteinuria": "",
  "clearence_creatinina": "",
  "somf": "",
  "hpv": ""
}

Devolvé SOLO el JSON sin ningún texto adicional, sin markdown, sin explicaciones.
Para valores negativos usá "NEGATIVO", para valores numéricos incluí la unidad (ej: "160 mg/dl").`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBase64
        }
      }
    ]);

    const texto = result.response.text().trim();
    
    // Limpiamos por si Gemini agrega markdown
    const jsonLimpio = texto.replace(/```json/g, '').replace(/```/g, '').trim();
    const valores = JSON.parse(jsonLimpio);

    return res.json({
      success: true,
      dni,
      nombre,
      apellido,
      valores
    });

  } catch (error) {
    console.error('Error leyendo PDF con Gemini:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error al procesar el PDF: ' + error.message 
    });
  }
});
app.post('/savePracticasLaboratorio', async (req, res) => {
  try {
    const { dni, practicas, idPrestador, nombrePrestador } = req.body;

    // 1. Guardamos en Google Sheets (mantenemos el flujo actual)
    const response = await axios.post(APPS_SCRIPT_URL, {
      action: 'guardarPracticasLaboratorio',
      payload: req.body
    });

    // 2. Actualizamos practicas_autorizadas en Supabase
    let guardadas = 0;
    let noAutorizadas = 0;

    for (const practica of practicas) {
      // Buscamos si existe la práctica autorizada
      const { data: existente } = await supabase
        .from('practicas_autorizadas')
        .select('id')
        .eq('dni', dni)
        .ilike('descripcion_practica', `%${practica.descripcion}%`)
        .eq('estado', 'AUTORIZADA')
        .single();

      if (existente) {
        // Actualizamos a REALIZADA
        await supabase
          .from('practicas_autorizadas')
          .update({
            estado: 'REALIZADA',
            resultado_texto: practica.valor,
            fecha_carga: new Date().toISOString(),
            id_prestador: idPrestador?.toString(),
            nombre_prestador: nombrePrestador
          })
          .eq('id', existente.id);
        guardadas++;
      } else {
        noAutorizadas++;
      }
    }

    res.json({ 
      success: true, 
      guardadas, 
      noAutorizadas,
      message: `${guardadas} prácticas guardadas.`
    });

  } catch (error) {
    console.error('Error en /savePracticasLaboratorio:', error.message);
    res.status(500).json({ success: false, message: 'Error de conexión.' });
  }
});

app.get('/getDatosAfiliado/:dni', async (req, res) => {
  try {
    const response = await axios.post(APPS_SCRIPT_URL, {
      action: 'getDatosAfiliado',
      payload: { dni: req.params.dni }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error de conexión.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));