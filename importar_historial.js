require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Cambiá este path por la ubicación exacta de tu CSV
const CSV_PATH = 'C:/Users/Usuario/Downloads/Produccion Dia Preventivo PR - Integrado.csv';

function parsearCSV(contenido) {
    const lineas = contenido.split('\n');
    const headers = lineas[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const registros = [];
    for (let i = 1; i < lineas.length; i++) {
        if (!lineas[i].trim()) continue;
        
        // Parser que maneja comas dentro de comillas
        const valores = [];
        let dentroComillas = false;
        let valorActual = '';
        
        for (let j = 0; j < lineas[i].length; j++) {
            const char = lineas[i][j];
            if (char === '"') {
                dentroComillas = !dentroComillas;
            } else if (char === ',' && !dentroComillas) {
                valores.push(valorActual.trim());
                valorActual = '';
            } else {
                valorActual += char;
            }
        }
        valores.push(valorActual.trim());
        
        const registro = {};
        headers.forEach((header, index) => {
            registro[header] = valores[index] || null;
        });
        registros.push(registro);
    }
    return registros;
}
const MAPA_COLUMNAS = {
    'Efector': 'efector',
    'Tipo': 'tipo',
    'DNI': 'dni',
    'ID': 'id_registro',
    'apellido y nombre': 'apellido_y_nombre',
    'Marca temporal': 'marca_temporal',
    'FECHAX': 'fechax',
    'Edad': 'edad',
    'Sexo': 'sexo',
    'Dislipemias': 'dislipemias',
    'Observaciones - Dislipemias': 'obs_dislipemias',
    'Diabetes': 'diabetes',
    'Observaciones - Diabetes': 'obs_diabetes',
    'Presi\u00c3\u00b3n Arterial': 'presion_arterial',
    'Observaciones - Presi\u00c3\u00b3n Arterial': 'obs_presion_arterial',
    'IMC': 'imc',
    'Observaciones - IMC': 'obs_imc',
    'Agudeza visual': 'agudeza_visual',
    'Observaciones - Agudeza visual': 'obs_agudeza_visual',
    'Control Odontol\u00c3\u00b3gico - Adultos': 'control_odontologico_adultos',
    'Valor CPO': 'valor_cpo',
    'Observaciones - Control odontol\u00c3\u00b3gico': 'obs_control_odontologico',
    'Alimentaci\u00c3\u00b3n saludable': 'alimentacion_saludable',
    'Observaciones - Alimentaci\u00c3\u00b3n saludable': 'obs_alimentacion',
    'Actividad f\u00c3\u00adsica': 'actividad_fisica',
    'Observaciones - Actividad f\u00c3\u00adsica': 'obs_actividad_fisica',
    'Seguridad vial': 'seguridad_vial',
    'Observaciones - Seguridad vial': 'obs_seguridad_vial',
    'Ca\u00c3\u00addas en adultos mayores': 'caidas_adultos_mayores',
    'Observaciones - Ca\u00c3\u00addas en adultos mayores': 'obs_caidas',
    '\u00c3cido f\u00c3\u00b3lico': 'acido_folico',
    'Observaciones - \u00c3cido f\u00c3\u00b3lico': 'obs_acido_folico',
    'Abuso alcohol': 'abuso_alcohol',
    'Observaciones - Abuso alcohol': 'obs_abuso_alcohol',
    'Tabaco': 'tabaco',
    'Observaciones - Tabaco': 'obs_tabaco',
    'Violencia': 'violencia',
    'Observaciones - Violencia': 'obs_violencia',
    'Depresi\u00c3\u00b3n': 'depresion',
    'Observaciones - Depresi\u00c3\u00b3n': 'obs_depresion',
    'ITS': 'its',
    'Observaciones - ITS': 'obs_its',
    'Hepatitis B': 'hepatitis_b',
    'Observaciones - Hepatitis B': 'obs_hepatitis_b',
    'Hepatitis C': 'hepatitis_c',
    'Observaciones - Hepatitis C': 'obs_hepatitis_c',
    'VIH': 'vih',
    'Observaciones - VIH': 'obs_vih',
    'C\u00c3\u00a1ncer c\u00c3\u00a9rvico uterino - HPV': 'cancer_cervico_hpv',
    'Observaciones - HPV': 'obs_hpv',
    'C\u00c3\u00a1ncer c\u00c3\u00a9rvico uterino - PAP': 'cancer_cervico_pap',
    'Observaciones - PAP': 'obs_pap',
    'SOMF': 'somf',
    'Observaciones - SOMF': 'obs_somf',
    'C\u00c3\u00a1ncer colon - Colonoscop\u00c3\u00ada': 'cancer_colon_colonoscopia',
    'Observaciones - Colonoscop\u00c3\u00ada': 'obs_colonoscopia',
    'C\u00c3\u00a1ncer mama - Mamograf\u00c3\u00ada': 'cancer_mama_mamografia',
    'Observaciones - Mamograf\u00c3\u00ada': 'obs_mamografia',
    'Cancer_mama_Eco_mamaria': 'cancer_mama_eco_mamaria',
    'Observaciones_Eco_mamaria': 'obs_eco_mamaria',
    'ERC': 'erc',
    'Observaciones - ERC': 'obs_erc',
    'EPOC': 'epoc',
    'Observaciones - EPOC': 'obs_epoc',
    'Aneurisma aorta': 'aneurisma_aorta',
    'Observaciones - Aneurisma aorta': 'obs_aneurisma_aorta',
    'Osteoporosis': 'osteoporosis',
    'Observaciones - Osteoporosis': 'obs_osteoporosis',
    'Estratificaci\u00c3\u00b3n riesgo CV': 'estratificacion_riesgo_cv',
    'Observaciones - Riesgo CV': 'obs_riesgo_cv',
    'Aspirina': 'aspirina',
    'Observaciones - Aspirina': 'obs_aspirina',
    'Inmunizaciones': 'inmunizaciones',
    'Observaciones - Inmunizaciones': 'obs_inmunizaciones',
    'Profesional': 'profesional',
    'VDRL': 'vdrl',
    'Observaciones - VDRL': 'obs_vdrl',
    'Pr\u00c3\u00b3stata - PSA': 'prostata_psa',
    'Observaciones - PSA': 'obs_psa',
    'Chagas': 'chagas',
    'Observaciones - Chagas': 'obs_chagas',
    'EF': 'ef',
    'Observaciones - Examen F\u00c3\u00adsico': 'obs_ef',
    'Talla': 'talla',
    'Observaciones - Talla': 'obs_talla',
    'Salud Ocular': 'salud_ocular',
    'Observaciones - Salud Ocular': 'obs_salud_ocular',
    'Audici\u00c3\u00b3n': 'audicion',
    'Observaciones - Audici\u00c3\u00b3n': 'obs_audicion',
    'Salud Cardiovascular': 'salud_cardiovascular',
    'Observaciones - Salud Cardiovascular': 'obs_salud_cardiovascular',
    'Educaci\u00c3\u00b3n sexual': 'educacion_sexual',
    'Observaciones - Educaci\u00c3\u00b3n sexual': 'obs_educacion_sexual',
    'Salud Mental Integral': 'salud_mental_integral',
    'Observaciones - Salud Mental': 'obs_salud_mental',
    'Consumo de sustancias problem\u00c3\u00a1ticas': 'consumo_sustancias',
    'Observaciones - Consumo de sustancias': 'obs_consumo_sustancias',
    'Pesquisa de Dislipemia': 'pesquisa_dislipemia',
    'Observaciones - Dislipemia': 'obs_pesquisa_dislipemia',
    'S\u00c3\u00adndrome Metab\u00c3\u00b3lico': 'sindrome_metabolico',
    'Observaciones - S\u00c3\u00adndrome Metab\u00c3\u00b3lico': 'obs_sindrome_metabolico',
    'Escoliosis': 'escoliosis',
    'Observaciones - Escoliosis': 'obs_escoliosis',
    'C\u00c3\u00a1ncer c\u00c3\u00a9rvico uterino': 'cancer_cervico_uterino',
    'Observaciones - C\u00c3\u00a1ncer c\u00c3\u00a9rvico uterino': 'obs_cancer_cervico_uterino',
    'C\u00c3\u00a1ncer de piel': 'cancer_piel',
    'Observaciones - C\u00c3\u00a1ncer de piel': 'obs_cancer_piel',
    'Desarrollo escolar y aprendizaje': 'desarrollo_escolar',
    'Observaciones - Desarrollo escolar': 'obs_desarrollo_escolar',
    'Uso de pantallas': 'uso_pantallas',
    'Cantidad de horas diarias': 'horas_pantallas',
    'Observaciones - Uso de pantallas': 'obs_uso_pantallas',
    'Control de vacunas de calendario': 'control_vacunas',
    'Observaciones - Vacunas': 'obs_control_vacunas',
    'Control Odontol\u00c3\u00b3gico - Ni\u00c3\u00b1os': 'control_odontologico_ninos',
    'Observaciones - Control Odontol\u00c3\u00b3gico': 'obs_control_odontologico_ninos',
    'link': 'link'
};
function convertirFecha(fechaStr) {
    if (!fechaStr) return null;
    fechaStr = fechaStr.toString().trim();
    
    // Formato DD/MM/YYYY o D/M/YYYY
    const match = fechaStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
        const dia = match[1].padStart(2, '0');
        const mes = match[2].padStart(2, '0');
        const anio = match[3];
        // Validamos que sea una fecha real
        const d = new Date(`${anio}-${mes}-${dia}`);
        if (isNaN(d.getTime())) return null;
        return `${anio}-${mes}-${dia}`;
    }
    return null;
}
async function importar() {
    console.log('Leyendo CSV...');
    
    // Leemos como buffer crudo y decodificamos correctamente
    const buffer = fs.readFileSync(CSV_PATH);
    const contenido = iconv.decode(buffer, 'latin1');
    const registros = parsearCSV(contenido);    
    console.log(`Total de registros encontrados: ${registros.length}`);
    
    const registrosMapeados = registros.map(reg => {
        const nuevo = {};
        Object.entries(reg).forEach(([clave, valor]) => {
            const claveSupabase = MAPA_COLUMNAS[clave];
            if (claveSupabase) {
                nuevo[claveSupabase] = valor === '' ? null : valor;
            }
        });

        // Convertimos las fechas al formato correcto
        if (nuevo.fechax) nuevo.fechax = convertirFecha(nuevo.fechax);
        if (nuevo.marca_temporal) {
            const fechaConv = convertirFecha(nuevo.marca_temporal);
            nuevo.marca_temporal = fechaConv || null;
        }

        // Corregimos el campo edad — si no es número lo ponemos null
        if (nuevo.edad) {
            const edadNum = parseInt(nuevo.edad);
            nuevo.edad = isNaN(edadNum) ? null : edadNum;
        }

        return nuevo;
    }).filter(r => r.dni);

    console.log(`Registros válidos con DNI: ${registrosMapeados.length}`);

    const BLOQUE = 100;
    let insertados = 0;
    let errores = 0;

    for (let i = 0; i < registrosMapeados.length; i += BLOQUE) {
        const bloque = registrosMapeados.slice(i, i + BLOQUE);
        
        const { error } = await supabase
            .from('historial_dia_preventivo')
            .insert(bloque);

        if (error) {
            console.error(`Error en bloque ${i}-${i + BLOQUE}:`, error.message);
            errores += bloque.length;
        } else {
            insertados += bloque.length;
            if (insertados % 1000 === 0) {
                console.log(`Insertados: ${insertados}/${registrosMapeados.length}`);
            }
        }
    }

    console.log(`\n✅ COMPLETADO: ${insertados} insertados, ${errores} errores`);
}

importar();