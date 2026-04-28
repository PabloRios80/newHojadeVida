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
