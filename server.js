require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { realtime: { transport: ws } }
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

app.get('/verificar-afiliado/:dni', async (req, res) => {
    const dni = req.params.dni;
    const hoy = new Date().toISOString().split('T')[0];
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <BEWsValidaAfi.Execute xmlns="IAPOS_WS">
            <Usuario>CONSULTAPDP</Usuario>
            <Passwd>1Qaz</Passwd>
            <Nafiliado>${dni}</Nafiliado>
            <Badocnumdo>${dni}</Badocnumdo>
            <Tidocodigo_de_documento>96</Tidocodigo_de_documento>
            <Ogorcodigo>1</Ogorcodigo>
            <Fechpresta>${hoy}</Fechpresta>
        </BEWsValidaAfi.Execute>
      </soap:Body>
    </soap:Envelope>`;
    try {
        const response = await axios.post(
            'https://aswe.santafe.gov.ar/iapos-sw-srvt/servlet/abewsvalidaafi',
            soapBody,
            {
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'SOAPAction': 'IAPOS_WSaction/ABEWSVALIDAAFI.Execute'
                },
                timeout: 10000
            }
        );
        const xml = response.data;
        const get = (tag) => {
            const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`));
            return m ? m[1].trim() : null;
        };
        const estado = get('Estado');
        res.json({
            esActivo: estado === 'A',
            estado,
            nombre: get('Apenom'),
            edad: get('Edad'),
            sexo: get('Sexo'),
            localidad: get('Localidad'),
            mensaje: get('Msgdsc')
        });

        console.log('XML IAPOS:', xml.substring(0, 500));
        console.log('Estado:', estado);
        console.log('XML IAPOS:', xml.substring(0, 1000));
    } catch(e) {
        res.status(500).json({ esActivo: false, error: e.message });
    }
});
app.post('/saveData', async (req, res) => {
  console.log("Recibida petición en /saveData...");
  const d = req.body;

  try {
    // 1. Guardar en Supabase (principal)
    const { error } = await supabase
      .from('afiliados')
      .upsert({
        dni:                    d.DNI,
        nombre:                 d.Nombre,
        apellido:               d.Apellido,
        fecha_nacimiento:       d.Fecha_Nacimiento,
        edad: parseInt(d.Edad) || null,
        email:                  d.Email,
        telefono:               d.Telefono,
        sexo_biologico:         d.Sexo_biologico,
        genero_autopercibido:   d.Genero_autopercibido,
        altura:                 d.Altura,
        peso:                   d.Peso,
        bmi:                    d.BMI,
        categoria_bmi:          d.Categoria_BMI,
        hipertension:           d.Hipertension,
        diabetes:               d.Diabetes,
        colesterol:             d.Colesterol,
        depresion:              d.Depresion,
        actividad_fisica:       d['Actividad fisica'],
        sedentarismo:           d.sedentarismo,
        abuso_alcohol_drogas:   d.Abuso_alcohol_drogas,
        stress:                 d.Stress,
        exceso_preocupacion_salud: d.Exceso_preocupacion_salud,
        exceso_pantalla:        d.Exceso_pantalla,
        fuma:                   d.Fuma,
        fumador_cronico:        d.Fumador_cronico,
        hipertension_familiar:  d.Hipertension_familiar,
        diabetes_familiar:      d.Diabetes_familiar,
        adicciones_familiar:    d.Adicciones_familiar,
        obesidad_familiar:      d['Obesidad _familiar'],
        depresion_familiar:     d.Depresion_familiar,
        violencia_familiar:     d.Violencia_familiar,
        cancer_de_colon:        d.Cancer_de_colon,
        cancer_de_mama:         d.Cancer_de_mama,
        cancer_cuello_utero:    d.Cancer_cuello_utero,
        cancer_de_prostata:     d.Cancer_de_prostata,
        fecha_carga:            new Date().toISOString()
      }, { onConflict: 'dni' });

    if (error) {
      console.error('Error Supabase:', error);
      return res.status(500).json({ success: false, message: 'Error al guardar en base de datos.' });
    }

    console.log('✅ Guardado en Supabase:', d.DNI);

    // Guardar copia histórica
await supabase.from('historial_hoja_de_vida').insert({
    dni:                       d.DNI,
    nombre:                    d.Nombre,
    apellido:                  d.Apellido,
    fecha_nacimiento:          d.Fecha_Nacimiento,
    edad:                      parseInt(d.Edad) || null,
    email:                     d.Email,
    telefono:                  d.Telefono,
    sexo_biologico:            d.Sexo_biologico,
    genero_autopercibido:      d.Genero_autopercibido,
    altura:                    d.Altura,
    peso:                      d.Peso,
    bmi:                       d.BMI,
    categoria_bmi:             d.Categoria_BMI,
    hipertension:              d.Hipertension,
    diabetes:                  d.Diabetes,
    colesterol:                d.Colesterol,
    depresion:                 d.Depresion,
    actividad_fisica:          d['Actividad fisica'],
    sedentarismo:              d.sedentarismo,
    abuso_alcohol_drogas:      d.Abuso_alcohol_drogas,
    stress:                    d.Stress,
    exceso_preocupacion_salud: d.Exceso_preocupacion_salud,
    exceso_pantalla:           d.Exceso_pantalla,
    fuma:                      d.Fuma,
    fumador_cronico:           d.Fumador_cronico,
    hipertension_familiar:     d.Hipertension_familiar,
    diabetes_familiar:         d.Diabetes_familiar,
    adicciones_familiar:       d.Adicciones_familiar,
    obesidad_familiar:         d['Obesidad _familiar'],
    depresion_familiar:        d.Depresion_familiar,
    violencia_familiar:        d.Violencia_familiar,
    cancer_de_colon:           d.Cancer_de_colon,
    cancer_de_mama:            d.Cancer_de_mama,
    cancer_cuello_utero:       d.Cancer_cuello_utero,
    cancer_de_prostata:        d.Cancer_de_prostata
});
console.log('✅ Historial guardado:', d.DNI);

    // 2. Backup en Google Sheets (no bloqueante)
    axios.post(APPS_SCRIPT_URL, {
      action: 'guardarHojaDeVida',
      payload: req.body
    }).catch(e => console.warn('Backup Google Sheets falló:', e.message));

    res.json({ success: true, message: 'Datos guardados correctamente.' });

  } catch (error) {
    console.error('Error en /saveData:', error.message);
    res.status(500).json({ success: false, message: 'Error al guardar.' });
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
  const { dni, codigo, descripcion, resultadoValor, archivoBase64, archivoNombre, idPrestador, nombrePrestador } = req.body;
  
  try {
    // Subir PDF a Supabase Storage si hay archivo
    let enlacePdf = null;
    if (archivoBase64) {
      const buffer = Buffer.from(archivoBase64, 'base64');
      const fileName = `${dni}/${Date.now()}_${archivoNombre}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resultados-practicas')
        .upload(fileName, buffer, { contentType: 'application/pdf' });
      
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('resultados-practicas')
          .getPublicUrl(fileName);
        enlacePdf = urlData.publicUrl;
      }
    }

    // Buscar práctica autorizada
    const { data: existente } = await supabase
      .from('practicas_autorizadas')
      .select('id')
      .eq('dni', dni)
      .ilike('descripcion_practica', `%${descripcion}%`)
      .eq('estado', 'AUTORIZADA')
      .single();

    if (existente) {
      await supabase
        .from('practicas_autorizadas')
        .update({
          estado: 'REALIZADA',
          resultado_texto: resultadoValor,
          enlace_pdf: enlacePdf,
          fecha_carga: new Date().toISOString(),
          id_prestador: idPrestador?.toString(),
          nombre_prestador: nombrePrestador
        })
        .eq('id', existente.id);

      res.json({ success: true, message: 'Práctica guardada correctamente.' });
    } else {
      res.json({ success: false, message: 'Práctica no encontrada o ya realizada.' });
    }

  } catch (error) {
    console.error('Error en /savePracticeResult:', error.message);
    res.status(500).json({ success: false, message: 'Error al guardar.' });
  }
});
app.get('/getPracticasGuardadas/:dni', async (req, res) => {
  const dni = req.params.dni;
  console.log(`Obteniendo prácticas para DNI: ${dni}`);

  try {
    // 1. Buscar afiliado
    const { data: afiliado } = await supabase
      .from('afiliados').select('*').eq('dni', dni).single();

    if (!afiliado) return res.json({ success: false, message: 'Afiliado no encontrado.' });

    // 2. Buscar último historial DP
    const { data: historial } = await supabase
      .from('historial_dia_preventivo')
      .select('*').eq('dni', dni)
      .order('fechax', { ascending: false }).limit(1);

    const ultimoDP = historial?.[0] || null;

    // 3. Leer reglas
    const { data: reglas } = await supabase
      .from('reglas_preventivas').select('*');

    const EQUIVALENCIAS = {
      'glucemia en ayunas': 'diabetes',
      'colesterol total, hdl/colesterol, ldl/colesterol, trigliceridos': 'dislipemias',
      'ldl/colesterol': 'dislipemias',
      'tomar ta ambos brazos personal capacitado': 'presion_arterial',
      'creatinina, formula filtrado glomerular': 'erc',
      'espirometria': 'epoc',
      'calcular imc': 'imc',
      'ecografia abdominal': 'aneurisma_aorta',
      'densitometria osea': 'osteoporosis',
      'papanicolau': 'cancer_cervico_pap',
      'test hpv': 'cancer_cervico_hpv',
      'sangre oculta en materia fecal - somf': 'somf',
      'videocolonoscopia - vcc': 'cancer_colon_colonoscopia',
      'mamografia': 'cancer_mama_mamografia',
      'ecografia mamaria': 'cancer_mama_eco_mamaria',
      'antigeno prostatico especifico total - psa': 'prostata_psa',
      'anticuerpos anti_vih': 'vih',
      'hepatitis b antigeno de superficie_aghb': 'hepatitis_b',
      'hepatitis c _hcv_ac_igg': 'hepatitis_c',
      'vdrl': 'vdrl',
      'test chagas': 'chagas',
      'vacunas': 'inmunizaciones',
      'control odontologico': 'control_odontologico_adultos',
      'control vision': 'agudeza_visual',
      'consejeria/tratamiento tabaquismo': 'tabaco',
      'consejeria/tratamiento alcohol y/o drogas': 'abuso_alcohol',
      'consejeria/tratamiento violencia familiar': 'violencia',
      'consejeria/tratamiento depresion': 'depresion',
      'consejeria/tratamiento caida adultos mayores': 'caidas_adultos_mayores',
      'consejeria actividad fisica': 'actividad_fisica'
    };

    const VALORES_REALIZADOS = [
      'normal','control normal','no presenta','no se verifica','negativo',
      'bajo','cumple','completo','si realiza','no abusa','no fuma',
      'riesgo bajo','adecuada','conservada','presenta'
    ];

    const VALORES_NO_APLICA = ['no aplica','no indicado','no corresponde'];

    const normalizar = (t) => (t||'').toString().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();

    const edad = parseInt(afiliado.edad) || 0;
    const sexo = normalizar(afiliado.sexo_biologico || '');
    const pendientes = [];
    const alDia = [];
    const procesadas = new Set();

    for (const regla of (reglas || [])) {
      if (!regla.practica) continue;
      const practicaNorm = normalizar(regla.practica);
      if (procesadas.has(practicaNorm)) continue;

      const sexoRegla = normalizar(regla.sexo_aplica || 'ambos');
      if (sexoRegla !== 'ambos' && sexoRegla !== sexo) continue;

      const edadDesde = parseInt(regla.edad_desde) || 0;
      const edadHasta = parseInt(regla.edad_hasta) || 120;
      if (edad < edadDesde || edad > edadHasta) continue;

      procesadas.add(practicaNorm);

      // ── VERIFICAR CONDICIÓN EN HOJA DE VIDA ──
      if (regla.condicion_campo && regla.condicion_valor) {
          const campoAfiliado = regla.condicion_campo.toLowerCase();
          const valorAfiliado = (afiliado[campoAfiliado] || '').toString().toLowerCase();
          const valoresAceptados = regla.condicion_valor.toLowerCase().split(',').map(v => v.trim());
          if (!valoresAceptados.some(v => valorAfiliado.includes(v))) continue;
      }

      const campoDP = EQUIVALENCIAS[practicaNorm];

      if (!ultimoDP || !campoDP) {
        pendientes.push({ practica: regla.practica, subcategoria: regla.subcategoria || '' });
        continue;
      }

      const valorCrudo = ultimoDP[campoDP] || '';
      const valorNorm = normalizar(valorCrudo);

      if (VALORES_NO_APLICA.some(v => valorNorm.includes(v))) continue;

      if (!valorNorm || valorNorm.includes('no se realiza') || valorNorm.includes('no se realizo')) {
        pendientes.push({ practica: regla.practica, subcategoria: regla.subcategoria || '' });
        continue;
      }

      const frecuencia = parseFloat(regla.frecuencia_anios) || 1;
      const fechaVisita = new Date(ultimoDP.fechax);
      const fechaVencimiento = new Date(fechaVisita);
      fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + frecuencia);
      const hoy = new Date();

      if (fechaVencimiento > hoy) {
        alDia.push({
          practica: regla.practica,
          subcategoria: regla.subcategoria || '',
          resultado: valorCrudo,
          fechaRealizacion: fechaVisita.toLocaleDateString('es-AR'),
          fechaVencimiento: fechaVencimiento.toLocaleDateString('es-AR')
        });
      } else {
        pendientes.push({
          practica: regla.practica,
          subcategoria: regla.subcategoria || '',
          ultimaVez: fechaVisita.toLocaleDateString('es-AR')
        });
      }
    }

    res.json({
      success: true,
      nombre: `${afiliado.nombre || ''} ${afiliado.apellido || ''}`.trim(),
      pendientes,
      alDia
    });

  } catch (error) {
    console.error('Error en /getPracticasGuardadas:', error.message);
    res.status(500).json({ success: false, message: 'Error de conexión.' });
  }
});
// --- Ruta para login de prestadores ---
app.post('/loginPrestador', async (req, res) => {
  try {
    const { usuario, password } = req.body;
    
    const { data, error } = await supabase
      .from('prestadores')
      .select('*')
      .eq('usuario', usuario)
      .eq('password', password)
      .eq('activo', true)
      .single();

    if (error || !data) {
      return res.json({ success: false, message: 'Usuario o contraseña incorrectos.' });
    }

    res.json({ 
      success: true, 
      prestador: {
        id: data.id,
        nombre: data.nombre,
        especialidad: data.especialidad,
        ciudad: data.ciudad
      }
    });
  } catch (error) {
    console.error('Error en /loginPrestador:', error.message);
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

app.get('/verificar-elegibilidad/:dni', async (req, res) => {
    const dni = req.params.dni;
    try {
        const { data: cierres } = await supabase
            .from('historial_dia_preventivo')
            .select('fechax')
            .eq('dni', dni)
            .order('fechax', { ascending: false })
            .limit(1);

        if (!cierres || cierres.length === 0) {
            return res.json({ elegible: true, mensaje: null });
        }

        const ultimoCierre = new Date(cierres[0].fechax);
        const hoy = new Date();
        const diasTranscurridos = (hoy - ultimoCierre) / (1000 * 60 * 60 * 24);

        if (diasTranscurridos < 365) {
            const diasRestantes = Math.ceil(365 - diasTranscurridos);
            const fechaHabilitacion = new Date(ultimoCierre);
            fechaHabilitacion.setFullYear(fechaHabilitacion.getFullYear() + 1);
            const fechaStr = fechaHabilitacion.toLocaleDateString('es-AR');
            return res.json({
                elegible: false,
                mensaje: `Ya realizó un Día Preventivo el ${ultimoCierre.toLocaleDateString('es-AR')}. Podrá realizar uno nuevo a partir del ${fechaStr} (faltan ${diasRestantes} días).`
            });
        }

        res.json({ elegible: true, mensaje: null });
    } catch(e) {
        console.error('Error verificar elegibilidad:', e.message);
        res.json({ elegible: true, mensaje: null }); // en caso de error dejamos pasar
    }
});

app.post('/saveDataMenores', async (req, res) => {
    const d = req.body;
    try {
        const { error } = await supabase
            .from('afiliados_menores')
            .insert({
                dni: d.dni, nombre: d.nombre, apellido: d.apellido,
                fecha_nacimiento: d.fecha_nacimiento, edad: d.edad,
                sexo_biologico: d.sexo_biologico, perfil: d.perfil,
                nombre_responsable: d.nombre_responsable,
                relacion_responsable: d.relacion_responsable,
                telefono: d.telefono, email: d.email,
                fam_hipertension: d.fam_hipertension, fam_diabetes: d.fam_diabetes,
                fam_obesidad: d.fam_obesidad, fam_cardio: d.fam_cardio,
                fam_mental: d.fam_mental, fam_adicciones: d.fam_adicciones,
                fam_cancer: d.fam_cancer, act_fisica: d.act_fisica,
                pantallas: d.pantallas, alimentacion: d.alimentacion,
                suenio: d.suenio, escuela: d.escuela, aprendizaje: d.aprendizaje,
                vacunas: d.vacunas, vision: d.vision, audicion: d.audicion,
                escoliosis: d.escoliosis, alim_trastorno: d.alim_trastorno,
                menarca: d.menarca, ciclos: d.ciclos, vinculos: d.vinculos,
                tristeza: d.tristeza, atencion_mental: d.atencion_mental,
                violencia: d.violencia, tabaco: d.tabaco, alcohol: d.alcohol,
                sustancias: d.sustancias, educ_sexual: d.educ_sexual,
                dudas: d.dudas, observaciones: d.observaciones
            });

        if (error) {
            console.error('Error Supabase menores:', error);
            return res.json({ success: false, message: error.message });
        }

        // Backup Google Sheets
        axios.post(APPS_SCRIPT_URL, {
            action: 'guardarHojaDeVidaMenor',
            payload: req.body
        }).catch(e => console.warn('Backup Google Sheets menores falló:', e.message));

        console.log('✅ Hoja de vida menor guardada:', d.dni);
        res.json({ success: true });
    } catch(e) {
        console.error('Error saveDataMenores:', e.message);
        res.status(500).json({ success: false, message: 'Error al guardar.' });
    }
});

app.post('/saveDataMenoresA', async (req, res) => {
    const d = req.body;
    try {
        const { error } = await supabase
            .from('afiliados_menores')
            .insert({
                dni: d.dni, nombre: d.nombre, apellido: d.apellido,
                fecha_nacimiento: d.fecha_nacimiento, edad: d.edad,
                sexo_biologico: d.sexo_biologico, perfil: d.perfil,
                nombre_responsable: d.nombre_responsable,
                relacion_responsable: d.relacion_responsable,
                telefono: d.telefono, email: d.email,
                termino: d.termino, tipo_parto: d.tipo_parto,
                neonatologia: d.neonatologia,
                complicacion_nacer: d.complicacion_nacer,
                lactancia: d.lactancia,
                lactancia_duracion: d.lactancia_duracion,
                alimentacion: d.alimentacion,
                alim_trastorno: d.alim_trastorno,
                suenio: d.suenio, pantallas: d.pantallas,
                lenguaje: d.lenguaje, motricidad: d.motricidad,
                interaccion: d.interaccion, esfinteres: d.esfinteres,
                escuela: d.escuela, vacunas: d.vacunas,
                controles_pediatricos: d.controles_pediatricos,
                vision: d.vision, audicion: d.audicion,
                condicion_salud: d.condicion_salud,
                condicion_detalle: d.condicion_detalle,
                observaciones: d.observaciones
            });

        if (error) {
            console.error('Error Supabase menores A:', error);
            return res.json({ success: false, message: error.message });
        }

        axios.post(APPS_SCRIPT_URL, {
            action: 'guardarHojaDeVidaMenorA',
            payload: req.body
        }).catch(e => console.warn('Backup Google Sheets menores A falló:', e.message));

        console.log('✅ Hoja de vida perfil A guardada:', d.dni);
        res.json({ success: true });
    } catch(e) {
        console.error('Error saveDataMenoresA:', e.message);
        res.status(500).json({ success: false, message: 'Error al guardar.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));