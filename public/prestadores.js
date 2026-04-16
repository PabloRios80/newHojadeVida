let practicaActual = null;

async function buscarPracticas() {
    const dni = document.getElementById('dniSearch').value;
    const lista = document.getElementById('listaPracticas');
    const loading = document.getElementById('loading');

    if (!dni) return alert("Ingrese un DNI");

    lista.innerHTML = '';
    loading.classList.remove('hidden');

    try {
        const response = await fetch(`/getPendingPractices/${dni}`);
        const data = await response.json();
        loading.classList.add('hidden');

        if (data.success && data.practicas.length > 0) {
            data.practicas.forEach(p => {
                const div = document.createElement('div');
                div.className = "bg-white p-4 rounded-lg shadow border-l-4 border-blue-900 flex justify-between items-center";
                div.innerHTML = `
                    <div>
                        <p class="font-bold">${p.descripcion_practica}</p>
                        <p class="text-sm text-gray-500">Cód: ${p.codigo_prestacion}</p>
                    </div>
                    <button onclick="abrirModal('${p.codigo_prestacion}', '${p.descripcion_practica}')" class="bg-blue-600 text-white px-4 py-2 rounded font-bold">CARGAR</button>
                `;
                lista.appendChild(div);
            });
        } else {
            lista.innerHTML = '<p class="text-center text-gray-500">No hay prácticas pendientes.</p>';
        }
    } catch (e) {
        loading.classList.add('hidden');
        alert("Error al conectar con el servidor.");
    }
}

function abrirModal(codigo, titulo) {
    practicaActual = { codigo };
    document.getElementById('modalTitulo').innerText = titulo;
    document.getElementById('modalCarga').classList.remove('hidden');
}

function cerrarModal() {
    document.getElementById('modalCarga').classList.add('hidden');
    document.getElementById('resultadoValor').value = '';
    document.getElementById('archivoPdf').value = '';
}

async function guardarPractica() {
    const valor = document.getElementById('resultadoValor').value;
    const inputArchivo = document.getElementById('archivoPdf');
    const dni = document.getElementById('dniSearch').value;

    if (!valor) return alert("Ingrese el resultado.");

    const payload = {
        dni: dni,
        codigo: practicaActual.codigo,
        descripcion: document.getElementById('modalTitulo').innerText,
        resultadoValor: valor,
        archivoBase64: null,
        archivoNombre: `Resultado_${dni}_${practicaActual.codigo}.pdf`
    };

    if (inputArchivo.files.length > 0) {
        payload.archivoBase64 = await toBase64(inputArchivo.files[0]);
    }

    try {
        const response = await fetch('/savePracticeResult', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const res = await response.json();
        if (res.success) {
            alert("¡Guardado correctamente!");
            cerrarModal();
            buscarPracticas();
        } else {
            alert("Error: " + res.message);
        }
    } catch (e) {
        alert("Error al guardar.");
    }
}

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
});