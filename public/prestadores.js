let practicaActual = null;
let prestadorActual = null;
let facturacionData = [];

// ==========================================
// LOGIN
// ==========================================
async function hacerLogin() {
    const usuario = document.getElementById('loginUsuario').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorDiv = document.getElementById('loginError');

    if (!usuario || !password) {
        errorDiv.textContent = 'Ingrese usuario y contraseña.';
        errorDiv.classList.remove('hidden');
        return;
    }

    try {
        const response = await fetch('/loginPrestador', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password })
        });
        const data = await response.json();

        if (data.success) {
            prestadorActual = data.prestador;
            sessionStorage.setItem('prestador', JSON.stringify(prestadorActual));
            mostrarPortal();
        } else {
            errorDiv.textContent = data.message || 'Usuario o contraseña incorrectos.';
            errorDiv.classList.remove('hidden');
        }
    } catch (e) {
        errorDiv.textContent = 'Error de conexión. Intentá de nuevo.';
        errorDiv.classList.remove('hidden');
    }
}

function mostrarPortal() {
    document.getElementById('pantallaLogin').classList.add('hidden');
    document.getElementById('portalPrincipal').classList.remove('hidden');
    document.getElementById('headerNombre').textContent = prestadorActual.nombre;
    document.getElementById('headerEspecialidad').textContent =
        prestadorActual.especialidad + ' — ' + prestadorActual.ciudad;
}

function cerrarSesion() {
    sessionStorage.removeItem('prestador');
    prestadorActual = null;
    document.getElementById('pantallaLogin').classList.remove('hidden');
    document.getElementById('portalPrincipal').classList.add('hidden');
    document.getElementById('loginUsuario').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('listaPracticas').innerHTML = '';
    document.getElementById('dniSearch').value = '';
}

// ==========================================
// BUSCAR PRÁCTICAS
// ==========================================
async function buscarPracticas() {
    const dni = document.getElementById('dniSearch').value.trim();
    const lista = document.getElementById('listaPracticas');
    const loading = document.getElementById('loading');
    const infoAfiliado = document.getElementById('infoAfiliado');

    if (!dni) return alert("Ingrese un DNI");
    if (!prestadorActual) return alert("Sesión expirada. Ingrese nuevamente.");

    lista.innerHTML = '';
    infoAfiliado.classList.add('hidden');
    loading.classList.remove('hidden');

    try {
        const response = await fetch(
            `/getPracticasPrestador/${dni}/${encodeURIComponent(prestadorActual.especialidad)}`
        );
        const data = await response.json();
        loading.classList.add('hidden');

        if (data.success && data.practicas.length > 0) {
            const primera = data.practicas[0];
            document.getElementById('nombreAfiliado').textContent =
                '👤 ' + (primera.nombre_completo || 'Afiliado DNI: ' + dni);
            document.getElementById('especialidadVista').textContent =
                'Prácticas de ' + prestadorActual.especialidad;
            infoAfiliado.classList.remove('hidden');
            // Mostrar selector de modo solo para laboratorio
            const modoCarga = document.getElementById('modoCargaLab');
            if (prestadorActual.especialidad === 'Laboratorio Bioquimico') {
                modoCarga.classList.remove('hidden');
            } else {
                modoCarga.classList.add('hidden');
            }

            const pendientes = data.practicas.filter(p =>
                (p.estado || '').toUpperCase() === 'AUTORIZADA'
            );
            const realizadas = data.practicas.filter(p =>
                (p.estado || '').toUpperCase() === 'REALIZADA'
            );

            if (pendientes.length > 0) {
                const tituloPendientes = document.createElement('h3');
                tituloPendientes.className = "font-bold text-gray-600 text-sm uppercase tracking-wide mt-2 mb-2";
                tituloPendientes.innerHTML = `<i class="fas fa-clock text-blue-500 mr-1"></i> Pendientes de carga (${pendientes.length})`;
                lista.appendChild(tituloPendientes);

                pendientes.forEach(p => {
                    const div = document.createElement('div');
                    div.className = "bg-white p-4 rounded-lg shadow border-l-4 border-blue-600 flex justify-between items-center";

                    const info = document.createElement('div');
                    info.innerHTML = `
                        <p class="font-bold text-gray-800">${p.descripcion_practica}</p>
                        <p class="text-xs text-gray-400">Cód: ${p.codigo_prestacion || 'S/C'}</p>
                    `;

                    const btn = document.createElement('button');
                    btn.className = "bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700";
                    btn.textContent = "CARGAR";
                    btn.addEventListener('click', function () {
                        abrirModal(p.codigo_prestacion, p.descripcion_practica);
                    });

                    div.appendChild(info);
                    div.appendChild(btn);
                    lista.appendChild(div);
                });
            }

            if (realizadas.length > 0) {
                const tituloRealizadas = document.createElement('h3');
                tituloRealizadas.className = "font-bold text-gray-600 text-sm uppercase tracking-wide mt-4 mb-2";
                tituloRealizadas.innerHTML = `<i class="fas fa-check-circle text-green-500 mr-1"></i> Ya cargadas (${realizadas.length})`;
                lista.appendChild(tituloRealizadas);

                realizadas.forEach(p => {
                    const div = document.createElement('div');
                    div.className = "bg-gray-50 p-4 rounded-lg border border-gray-200 border-l-4 border-l-green-500 flex justify-between items-center opacity-75";
                    div.innerHTML = `
                        <div>
                            <p class="font-bold text-gray-600">${p.descripcion_practica}</p>
                            <p class="text-xs text-gray-400">
                                Cargada: ${p.fecha_carga ? new Date(p.fecha_carga).toLocaleDateString('es-AR') : 'S/F'}
                            </p>
                        </div>
                        <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                            ✓ REALIZADA
                        </span>`;
                    lista.appendChild(div);
                });
            }

        } else {
            const msg = document.createElement('div');
            msg.className = "bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center";
            msg.innerHTML = `
                <i class="fas fa-info-circle text-yellow-500 text-2xl mb-2"></i>
                <p class="text-gray-600">No hay prácticas pendientes para este afiliado
                en la especialidad <strong>${prestadorActual.especialidad}</strong>.</p>`;
            lista.appendChild(msg);
        }
    } catch (e) {
        loading.classList.add('hidden');
        alert("Error al conectar con el servidor.");
    }
}

// ==========================================
// MODAL CARGA
// ==========================================
function abrirModal(codigo, descripcion) {
    practicaActual = { codigo, descripcion };
    document.getElementById('modalTitulo').textContent = descripcion;
    document.getElementById('resultadoValor').value = '';
    document.getElementById('archivoPdf').value = '';
    document.getElementById('modalCarga').classList.remove('hidden');
}

function cerrarModal() {
    document.getElementById('modalCarga').classList.add('hidden');
    document.getElementById('resultadoValor').value = '';
    document.getElementById('archivoPdf').value = '';
}

async function guardarPractica() {
    const valor = document.getElementById('resultadoValor').value.trim();
    const inputArchivo = document.getElementById('archivoPdf');
    const dni = document.getElementById('dniSearch').value.trim();

    if (!valor) return alert("Ingrese el resultado.");

    let archivoBase64 = null;
    if (inputArchivo.files && inputArchivo.files.length > 0) {
        try {
            archivoBase64 = await toBase64(inputArchivo.files[0]);
        } catch (e) {
            alert("Error al procesar el PDF.");
            return;
        }
    }

    const payload = {
        dni: dni,
        codigo: practicaActual.codigo,
        descripcion: practicaActual.descripcion,
        resultadoValor: valor,
        archivoBase64: archivoBase64,
        archivoNombre: `Resultado_${dni}_${practicaActual.descripcion}.pdf`,
        idPrestador: prestadorActual.id,
        nombrePrestador: prestadorActual.nombre
    };

    try {
        const response = await fetch('/savePracticeResult', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const res = await response.json();
        if (res.success) {
            alert("✅ Cargado correctamente.");
            cerrarModal();
            buscarPracticas();
        } else {
            alert("Error: " + res.message);
        }
    } catch (e) {
        alert("Error al guardar.");
    }
}

// ==========================================
// FACTURACIÓN
// ==========================================
function verFacturacion() {
    const hoy = new Date();
    document.getElementById('mesFact').value = hoy.getMonth() + 1;
    document.getElementById('anioFact').value = hoy.getFullYear();
    document.getElementById('tablaFacturacion').innerHTML = '';
    document.getElementById('btnDescargarExcel').classList.add('hidden');
    document.getElementById('modalFacturacion').classList.remove('hidden');
    facturacionData = [];
}

function cerrarModalFacturacion() {
    document.getElementById('modalFacturacion').classList.add('hidden');
}

async function generarFacturacion() {
    const mes = document.getElementById('mesFact').value;
    const anio = document.getElementById('anioFact').value;
    const tablaDiv = document.getElementById('tablaFacturacion');

    tablaDiv.innerHTML = '<p class="text-center text-gray-500 py-4"><i class="fas fa-spinner fa-spin mr-2"></i>Cargando...</p>';

    try {
        const response = await fetch(
            `/getFacturacion/${prestadorActual.id}/${mes}/${anio}`
        );
        const data = await response.json();

        if (data.success && data.practicas.length > 0) {
            // Guardamos con índice para poder eliminar filas
            facturacionData = data.practicas.map((p, i) => ({ ...p, _incluir: true, _index: i }));
            renderTablaFacturacion();
        } else {
            tablaDiv.innerHTML = `
                <p class="text-center text-gray-500 py-4">
                    No hay prácticas realizadas pendientes de facturación en ese período.
                </p>`;
            document.getElementById('btnDescargarExcel').classList.add('hidden');
        }
    } catch (e) {
        tablaDiv.innerHTML = '<p class="text-red-500 text-center">Error al cargar datos.</p>';
    }
}

function renderTablaFacturacion() {
    const tablaDiv = document.getElementById('tablaFacturacion');
    const incluidas = facturacionData.filter(p => p._incluir);

    if (incluidas.length === 0) {
        tablaDiv.innerHTML = '<p class="text-center text-gray-500 py-4">No quedan prácticas para facturar.</p>';
        document.getElementById('btnDescargarExcel').classList.add('hidden');
        return;
    }

    // Contenedor principal
    tablaDiv.innerHTML = `
        <p class="text-sm text-gray-500 mb-3 italic">
            <i class="fas fa-info-circle mr-1"></i>
            Podés quitar prácticas que no vas a facturar este mes haciendo click en 
            <span class="text-red-500 font-bold">✕</span>
        </p>`;

    // Tabla
    const tabla = document.createElement('table');
    tabla.className = "w-full text-sm border-collapse";
    tabla.innerHTML = `
        <thead>
            <tr class="bg-blue-900 text-white">
                <th class="p-2 text-left">Fecha</th>
                <th class="p-2 text-left">DNI</th>
                <th class="p-2 text-left">Afiliado</th>
                <th class="p-2 text-left">Práctica</th>
                <th class="p-2 text-left">Código</th>
                <th class="p-2 text-center">Quitar</th>
            </tr>
        </thead>`;

    const tbody = document.createElement('tbody');

    incluidas.forEach(p => {
        const fecha = p.fecha_carga
            ? new Date(p.fecha_carga).toLocaleDateString('es-AR')
            : 'S/F';

        const tr = document.createElement('tr');
        tr.className = "border-b hover:bg-gray-50";
        tr.innerHTML = `
            <td class="p-2">${fecha}</td>
            <td class="p-2">${p.dni || ''}</td>
            <td class="p-2">${p.nombre_completo || ''}</td>
            <td class="p-2">${p.descripcion_practica || ''}</td>
            <td class="p-2">${p.codigo_prestacion || 'S/C'}</td>
            <td class="p-2 text-center"></td>`;

        // Botón quitar con addEventListener
        const btnQuitar = document.createElement('button');
        btnQuitar.className = "text-red-500 hover:text-red-700 font-bold text-lg leading-none";
        btnQuitar.textContent = "✕";
        btnQuitar.addEventListener('click', function() {
            quitarDeFacturacion(p._index);
        });
        tr.lastElementChild.appendChild(btnQuitar);

        tbody.appendChild(tr);
    });

    tabla.appendChild(tbody);
    tablaDiv.appendChild(tabla);

    // Total
    const total = document.createElement('p');
    total.className = "text-right font-bold text-gray-700 mt-3";
    total.innerHTML = `Total a facturar: <span class="text-blue-900">${incluidas.length} prácticas</span>`;
    tablaDiv.appendChild(total);

    document.getElementById('btnDescargarExcel').classList.remove('hidden');
}
function quitarDeFacturacion(index) {
    facturacionData[index]._incluir = false;
    renderTablaFacturacion();
}

async function descargarExcel() {
    const incluidas = facturacionData.filter(p => p._incluir);
    if (!incluidas.length) return alert("No hay prácticas para facturar.");

    const mes = document.getElementById('mesFact').value;
    const anio = document.getElementById('anioFact').value;

    // Generamos el CSV
    const headers = ['Fecha', 'DNI Afiliado', 'Afiliado', 'Práctica', 'Código', 'Prestador'];
    const filas = incluidas.map(p => [
        p.fecha_carga ? new Date(p.fecha_carga).toLocaleDateString('es-AR') : '',
        p.dni || '',
        p.nombre_completo || '',
        p.descripcion_practica || '',
        p.codigo_prestacion || '',
        prestadorActual.nombre
    ]);

    const csvContent = [headers, ...filas]
        .map(fila => fila.map(celda => `"${celda}"`).join(','))
        .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Facturacion_${prestadorActual.nombre}_${mes}_${anio}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    // Marcamos como FACTURADAS en la hoja
    try {
        const practicasAMarcar = incluidas.map(p => ({
            dni: p.dni,
            descripcion: p.descripcion_practica
        }));

        await fetch('/marcarFacturadas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idPrestador: prestadorActual.id,
                practicas: practicasAMarcar
            })
        });

        alert(`✅ Planilla descargada. ${incluidas.length} prácticas marcadas como FACTURADAS.`);
        cerrarModalFacturacion();

    } catch (e) {
        alert("La planilla se descargó pero hubo un error al actualizar el estado. Contacte al administrador.");
    }
}
// ==========================================
// CARGA PDF LABORATORIO
// ==========================================
function modoCargaIndividual() {
    document.getElementById('modoCargaLab').classList.add('hidden');
}
function modoCargaPDF() {
    document.getElementById('pdfResultado').classList.add('hidden');
    document.getElementById('pdfResultado').innerHTML = '';
    // Iniciamos con un solo textarea
    document.getElementById('contenedorInformes').innerHTML = '';
    agregarInforme();
    document.getElementById('modalPDFLab').classList.remove('hidden');
}

function cerrarModalPDFLab() {
    document.getElementById('modalPDFLab').classList.add('hidden');
    document.getElementById('contenedorInformes').innerHTML = '';
    document.getElementById('pdfResultado').classList.add('hidden');
}

function agregarInforme() {
    const contenedor = document.getElementById('contenedorInformes');
    const index = contenedor.children.length + 1;

    const div = document.createElement('div');
    div.className = "relative border border-gray-200 rounded-lg p-2";
    div.innerHTML = `
        <div class="flex justify-between items-center mb-1">
            <label class="text-sm font-bold text-gray-600">
                <i class="fas fa-file-pdf text-red-500 mr-1"></i>Informe ${index}
            </label>
            ${index > 1 ? `<button onclick="this.closest('div.relative').remove()" 
                class="text-red-400 hover:text-red-600 text-xs">
                <i class="fas fa-times"></i> Quitar
            </button>` : ''}
        </div>
        <textarea class="textoPDFItem w-full border border-gray-300 rounded-lg p-2 
                         outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono" 
                  rows="4"
                  placeholder="Pegá aquí el texto copiado del PDF ${index}..."></textarea>
    `;
    contenedor.appendChild(div);
}
async function procesarTodosLosInformes() {
    const textareas = document.querySelectorAll('.textoPDFItem');
    const dni = document.getElementById('dniSearch').value.trim();
    const resultadoDiv = document.getElementById('pdfResultado');

    if (!dni) return alert("Ingresá el DNI del paciente primero.");

    const textos = Array.from(textareas)
        .map(t => t.value.trim())
        .filter(t => t.length > 0);

    if (textos.length === 0) return alert("Pegá al menos un informe.");

    // Verificamos DNIs de cada informe
    const dnisDiferentes = [];
    textos.forEach((texto, i) => {
        const dniDetectado = extraerDNIDelTexto(texto);
        if (dniDetectado && dniDetectado !== dni) {
            dnisDiferentes.push({
                informe: i + 1,
                dniDetectado
            });
        }
    });

    // Si hay DNIs que no coinciden avisamos
    if (dnisDiferentes.length > 0) {
        const mensajes = dnisDiferentes.map(d =>
            `Informe ${d.informe}: DNI ${d.dniDetectado}`
        ).join('\n');

        const confirmar = confirm(
            `⚠️ ATENCIÓN: Se detectaron informes con DNI diferente al paciente buscado (${dni}):\n\n` +
            `${mensajes}\n\n` +
            `¿Querés continuar igualmente cargando todo para el DNI ${dni}?`
        );

        if (!confirmar) return;
    }

    // Combinamos todos los valores
    let valoresCombinados = {};
    textos.forEach(texto => {
        const valores = extraerValoresLaboratorio(texto);
        Object.entries(valores).forEach(([campo, valor]) => {
            if (valor && !valoresCombinados[campo]) {
                valoresCombinados[campo] = valor;
            }
        });
    });

    const valoresConDatos = Object.entries(valoresCombinados).filter(([k, v]) => v);

    if (valoresConDatos.length === 0) {
        alert("No se encontraron valores. Verificá que el texto esté completo.");
        return;
    }

    mostrarValoresExtraidos({
        dni,
        nombre: '',
        apellido: '',
        valores: valoresCombinados
    });
}
function extraerDNIDelTexto(texto) {
    // Busca patrones de DNI en el texto
    const patrones = [
        /DNI[:\s]+(\d{7,8})/i,
        /D\.N\.I[:\s]+(\d{7,8})/i,
        /DOCUMENTO[:\s]+(\d{7,8})/i,
        // También del formato Omega: "TORRES NATALIA GUADALUPE 32733266"
        /PACIENTE[:\s]+[A-ZÁÉÍÓÚ\s]+(\d{7,8})/i
    ];

    for (const patron of patrones) {
        const match = texto.match(patron);
        if (match) return match[1];
    }
    return null;
}

function extraerValoresLaboratorio(texto) {
    const lineas = texto.split('\n').map(l => l.trim()).filter(l => l);

    // ── FUNCIONES AUXILIARES ──────────────────────────────────────────

    function buscarValor(terminosClave, maxLineas = 6) {
        for (let i = 0; i < lineas.length; i++) {
            const lineaUpper = lineas[i].toUpperCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            const encontrado = terminosClave.some(t =>
                lineaUpper.includes(t.toUpperCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
            );

            if (encontrado) {
                const matchMisma = lineas[i].match(
                    /(\d+[.,]?\d*\s*(?:mg\/d[lI]|g\/l|ml\/min|ng\/ml|%|mg\/l|u\/l))/i
                );
                if (matchMisma) return matchMisma[1].trim();

                for (let j = i + 1; j < Math.min(i + maxLineas, lineas.length); j++) {
                    const lineaSigUpper = lineas[j].toUpperCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    if (lineaSigUpper.includes('METODO:')) break;
                    const matchNum = lineas[j].match(
                        /(\d+[.,]?\d*\s*(?:mg\/d[lI]|g\/l|ml\/min|ng\/ml|%|mg\/l|u\/l))/i
                    );
                    if (matchNum) return matchNum[1].trim();
                }
            }
        }
        return null;
    }

    function buscarEstado(terminosClave, maxLineas = 3) {
        for (let i = 0; i < lineas.length; i++) {
            const lineaUpper = lineas[i].toUpperCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            const encontrado = terminosClave.some(t =>
                lineaUpper.includes(t.toUpperCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
            );

            if (encontrado) {
                const matchMisma = lineas[i].match(
                    /(NEGATIVO|POSITIVO|REACTIVO|NO REACTIVO|DETECTABLE|NO DETECTABLE)/i
                );
                if (matchMisma) return matchMisma[1].toUpperCase();

                for (let j = i + 1; j < Math.min(i + maxLineas, lineas.length); j++) {
                    const match = lineas[j].match(
                        /^(NEGATIVO|POSITIVO|REACTIVO|NO REACTIVO|DETECTABLE|NO DETECTABLE)$/i
                    );
                    if (match) return match[1].toUpperCase();
                }
            }
        }
        return null;
    }
    function buscarColesterolTotal() {
    for (let i = 0; i < lineas.length; i++) {
        const l = lineas[i].toUpperCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        if (l.includes('COLESTEROL') &&
            !l.includes('HDL') &&
            !l.includes('LDL') &&
            !l.includes('REFERENCIA')) {

            // Buscamos en la misma línea
            const m = lineas[i].match(/(\d+[.,]?\d*\s*mg\/d[lI])/i);
            if (m) return m[1].trim();

            // Buscamos en las siguientes líneas
            // Saltamos las de referencia pero no paramos en ellas
            for (let j = i + 1; j < Math.min(i + 8, lineas.length); j++) {
                const lj = lineas[j].toUpperCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                // Saltamos líneas de referencia y descripción
                if (lj.includes('VALORES DE REFERENCIA') ||
                    lj.includes('DESEABLE') ||
                    lj.includes('MODERADAMENTE') ||
                    lj.includes('METODO:')) continue;

                // Si encontramos otra práctica con nombre largo paramos
                if (lj.length > 40 && 
                    !lj.match(/^\d/) && 
                    !lj.includes('COLESTEROL')) break;

                const mj = lineas[j].match(/(\d+[.,]?\d*\s*mg\/d[lI])/i);
                if (mj) return mj[1].trim();
            }
        }
    }
    return null;
}

    function buscarHDL() {
        for (let i = 0; i < lineas.length; i++) {
            const l = lineas[i].toUpperCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (l.includes('HDL') && l.includes('COLESTEROL')) {
                const m = lineas[i].match(/(\d+[.,]?\d*\s*mg\/d[lI])/i);
                if (m) return m[1].trim();
                for (let j = i + 1; j < Math.min(i + 4, lineas.length); j++) {
                    const lj = lineas[j].toUpperCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    if (lj.includes('LDL') || lj.includes('REFERENCIA')) break;
                    const mj = lineas[j].match(/^(\d+[.,]?\d*\s*mg\/d[lI])/i);
                    if (mj) return mj[1].trim();
                }
            }
        }
        return null;
    }

    function buscarLDL() {
        for (let i = 0; i < lineas.length; i++) {
            const l = lineas[i].toUpperCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (l.includes('LDL') && l.includes('COLESTEROL')) {
                const m = lineas[i].match(/(\d+[.,]?\d*\s*mg\/d[lI])/i);
                if (m) return m[1].trim();
                for (let j = i + 1; j < Math.min(i + 4, lineas.length); j++) {
                    const lj = lineas[j].toUpperCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    if (lj.includes('REFERENCIA')) break;
                    const mj = lineas[j].match(/^(\d+[.,]?\d*\s*mg\/d[lI])/i);
                    if (mj) return mj[1].trim();
                }
            }
        }
        return null;
    }

    function buscarFiltradoGlomerular() {
        for (let i = 0; i < lineas.length; i++) {
            const l = lineas[i].toUpperCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (l.includes('FILTRADO GLOMERULAR') || l.includes('FILTRO GLOMERULAR')) {
                for (let j = i; j < Math.min(i + 4, lineas.length); j++) {
                    const m = lineas[j].match(/(\d+[.,]\d+\s*ml\/min)/i);
                    if (m) return m[1].trim();
                }
            }
        }
        return null;
    }

    function buscarSOMF() {
        const t = texto.toUpperCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // Formato Omega — buscarEstado normal
        const porEstado = buscarEstado(['SANGRE OCULTA', 'SOMF']);
        if (porEstado) return porEstado;

        // Formato IAPOS — "Test Sangre Oculta en Materia Fecal: POSITIVO"
        const matchIAPOS = t.match(
            /TEST\s+SANGRE\s+OCULTA[^A-Z]*(POSITIVO|NEGATIVO)/
        );
        if (matchIAPOS) return matchIAPOS[1];

        // Formato simple línea siguiente
        for (let i = 0; i < lineas.length; i++) {
            const l = lineas[i].toUpperCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (l.includes('SANGRE OCULTA') || l.includes('SOMF')) {
                const m = lineas[i].match(/(POSITIVO|NEGATIVO)/i);
                if (m) return m[1].toUpperCase();
                if (lineas[i + 1]) {
                    const m2 = lineas[i + 1].match(/^(POSITIVO|NEGATIVO)$/i);
                    if (m2) return m2[1].toUpperCase();
                }
            }
        }
        return null;
    }

    // ── RESULTADO FINAL ───────────────────────────────────────────────
    return {
        glucemia:                      buscarValor(['GLUCOSA', 'GLUCEMIA', 'GLUCEMIA EN AYUNAS']),
        trigliceridos:                 buscarValor(['TRIGLICERIDOS', 'TRIGLICÉRIDOS']),
        colesterol_total:              buscarColesterolTotal(),
        colesterol_hdl:                buscarHDL(),
        colesterol_ldl:                buscarLDL(),
        creatinina:                    buscarValor(['CREATININA']),
        indice_filtrado_glomerular:    buscarFiltradoGlomerular(),
        psa:                           buscarValor(['PSA', 'PSA - AG', 'PROSTATICO', 'PROSTÁTICO', 'ANTIGENO PROSTATICO', 'ANTÍGENO PROSTÁTICO']),
        hiv:                           buscarEstado(['HIV', 'VIH']),
        hepatitis_b_antigeno_superficie: buscarEstado(['HBSAG', 'AG DE SUPERFICIE', 'HEPATITIS B - HBS']),
        hepatitis_b_anti_core:         buscarEstado(['ANTI HBC', 'ANTI HBC (CORE)', 'AC. IGG ANTI HBC', 'HEPATITIS B - AC. IGG']),
        hepatitis_c:                   buscarEstado(['HEPATITIS C', 'ANTI HCV', 'HCV']),
        vdrl:                          buscarEstado(['VDRL', 'USR']),
        chagas_hai:                    buscarEstado(['CHAGAS AC. - HAI', 'CHAGAS HAI', 'CHAGAS - HAI']),
        chagas_eclia:                  buscarEstado(['CHAGAS AC. IGG', 'CHAGAS ECLIA', 'CHAGAS IGG']),
        hpv_genotipo_16:               buscarEstado(['HPV GENOTIPO 16', 'GENOTIPO 16']),
        hpv_genotipo_18:               buscarEstado(['HPV GENOTIPO 18', 'GENOTIPO 18']),
        hpv_otros:                     buscarEstado(['HPV OTROS GENOTIPOS', 'OTROS GENOTIPOS DE ALTO RIESGO']),
        hemoglobina_glicosilada:       buscarValor(['HEMOGLOBINA GLICOSILADA', 'HBA1C', 'HB A1C']),
        somf:                          buscarSOMF(),
        microalbuminuria:              buscarValor(['MICROALBUMINURIA', 'ALBUMINA ORINA', 'MICROALBUMINA']),
        proteinuria:                   buscarValor(['PROTEINURIA', 'PROTEINAS EN ORINA']),
        clearence_creatinina:          buscarValor(['CLEARENCE', 'DEPURACION DE CREATININA', 'DEPURACIÓN'])
    };
}
function mostrarValoresExtraidos(data) {
    const resultadoDiv = document.getElementById('pdfResultado');
const ETIQUETAS = {
    glucemia: 'Glucemia',
    creatinina: 'Creatinina',
    indice_filtrado_glomerular: 'Índice Filtrado Glomerular',
    colesterol_total: 'Colesterol Total',
    colesterol_hdl: 'Colesterol HDL',
    colesterol_ldl: 'Colesterol LDL',
    trigliceridos: 'Triglicéridos',
    hiv: 'HIV',
    hepatitis_b_antigeno_superficie: 'Hepatitis B Ag Superficie',
    hepatitis_b_anti_core: 'Hepatitis B Anti Core',
    hepatitis_c: 'Hepatitis C',
    vdrl: 'VDRL',
    psa: 'PSA',
    chagas_hai: 'Chagas HAI',
    chagas_eclia: 'Chagas ECLIA',
    hpv_genotipo_16: 'HPV Genotipo 16',
    hpv_genotipo_18: 'HPV Genotipo 18',
    hpv_otros: 'HPV Otros Genotipos Alto Riesgo',
    hemoglobina_glicosilada: 'Hemoglobina Glicosilada',
    microalbuminuria: 'Microalbuminuria',
    proteinuria: 'Proteinuria',
    clearence_creatinina: 'Clearence Creatinina',
    somf: 'SOMF'
};

const MAPEO_PRACTICAS = {
    glucemia: 'glucemia en ayunas',
    creatinina: 'creatinina',
    indice_filtrado_glomerular: 'formula filtrado glomerular',
    colesterol_total: 'colesterol total',
    colesterol_hdl: 'HDL/colesterol',
    colesterol_ldl: 'LDL/colesterol',
    trigliceridos: 'trigliceridos',
    hiv: 'anticuerpos anti_VIH',
    hepatitis_b_antigeno_superficie: 'hepatitis b antigeno de superficie_AGHB',
    hepatitis_b_anti_core: 'hepatitis b antigeno de superficie_AGHB',
    hepatitis_c: 'hepatitis c _HCV_AC_IGG',
    vdrl: 'VDRL',
    psa: 'antigeno prostatico especifico total - PSA',
    chagas_hai: 'test chagas',
    chagas_eclia: 'test chagas',
    hpv_genotipo_16: 'test HPV',
    hpv_genotipo_18: 'test HPV',
    hpv_otros: 'test HPV',
    hemoglobina_glicosilada: 'hemoglobina glicosilada',
    microalbuminuria: 'microalbuminuria',
    proteinuria: 'proteinuria',
    clearence_creatinina: 'clearence creatinina',
    somf: 'sangre oculta en materia fecal - SOMF'
};

    const valores = data.valores;
    const valoresConDatos = Object.entries(valores).filter(([k, v]) => v);

    let html = `
        <div class="border-t pt-3">
            <p class="font-bold text-gray-700 mb-2">
                <i class="fas fa-check-circle text-green-500 mr-1"></i>
                Se encontraron ${valoresConDatos.length} resultados. Revisá y confirmá:
            </p>
            <div class="space-y-1 mb-3">`;

    valoresConDatos.forEach(([campo, valor]) => {
        html += `
            <div class="flex justify-between items-center bg-gray-50 px-3 py-2 rounded text-sm">
                <span class="text-gray-700">${ETIQUETAS[campo] || campo}</span>
                <span class="font-bold text-blue-900">${valor}</span>
            </div>`;
    });

    // Guardamos datos para el botón confirmar
    window._datosPDFLab = { data, mapeo: MAPEO_PRACTICAS };

    html += `</div>
            <button id="btnConfirmarPDF"
                class="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">
                <i class="fas fa-save mr-2"></i>CONFIRMAR Y GUARDAR TODO
            </button>
        </div>`;

    resultadoDiv.classList.remove('hidden');
    resultadoDiv.innerHTML = html;

    // Evento en el botón confirmar
    document.getElementById('btnConfirmarPDF').addEventListener('click', () => {
        confirmarCargaPDFLab(window._datosPDFLab.data, window._datosPDFLab.mapeo);
    });
}
async function confirmarCargaPDFLab(data, mapeo) {
    const valores = data.valores;
    const dni = data.dni;
    const resultadoDiv = document.getElementById('pdfResultado');

    resultadoDiv.innerHTML = `
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <i class="fas fa-spinner fa-spin text-blue-600 text-2xl mb-2"></i>
            <p class="text-blue-700">Guardando prácticas...</p>
        </div>`;

    // Armamos array con todas las prácticas de una sola vez
    const practicasParaGuardar = [];
    Object.entries(valores).forEach(([campo, valor]) => {
        if (!valor) return;
        const descripcion = mapeo[campo];
        if (!descripcion) return;
        practicasParaGuardar.push({ descripcion, valor });
    });

    if (practicasParaGuardar.length === 0) {
        resultadoDiv.innerHTML = `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p class="text-yellow-700">No hay prácticas para guardar.</p>
            </div>`;
        return;
    }

    try {
        const response = await fetch('/savePracticasLaboratorio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dni: dni,
                practicas: practicasParaGuardar,
                idPrestador: prestadorActual.id,
                nombrePrestador: prestadorActual.nombre
            })
        });

        const res = await response.json();

        let mensaje = '';
        if (res.success) {
            mensaje = `<p class="font-bold text-green-700">✅ ${res.guardadas} prácticas guardadas.</p>`;
            if (res.noAutorizadas > 0) {
                mensaje += `<p class="text-yellow-600 text-sm mt-1">ℹ️ ${res.noAutorizadas} no estaban autorizadas para este paciente.</p>`;
            }
        } else {
            mensaje = `<p class="text-red-600">Error: ${res.message}</p>`;
        }

        resultadoDiv.innerHTML = `
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <i class="fas fa-check-circle text-green-600 text-2xl mb-2"></i>
                ${mensaje}
            </div>`;

        setTimeout(() => {
            cerrarModalPDFLab();
            buscarPracticas();
        }, 2000);

    } catch (e) {
        resultadoDiv.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p class="text-red-600">Error de conexión. Intentá de nuevo.</p>
            </div>`;
    }
}
// ==========================================
// UTILIDADES
// ==========================================
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
});

document.addEventListener('DOMContentLoaded', () => {
    const sesionGuardada = sessionStorage.getItem('prestador');
    if (sesionGuardada) {
        prestadorActual = JSON.parse(sesionGuardada);
        mostrarPortal();
    }
    document.getElementById('btnGuardarPractica').addEventListener('click', guardarPractica);

    document.getElementById('loginPassword').addEventListener('keypress', e => {
        if (e.key === 'Enter') hacerLogin();
    });

    document.getElementById('dniSearch')?.addEventListener('keypress', e => {
        if (e.key === 'Enter') buscarPracticas();
    });
});
