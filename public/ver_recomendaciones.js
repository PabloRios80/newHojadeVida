document.addEventListener('DOMContentLoaded', function() {
    const resultadosDiv = document.getElementById('resultadosRecomendaciones');

    // 1. Obtener DNI de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const dni = urlParams.get('dni');

    if (dni) {
        buscarRecomendaciones(dni);
    } else {
        resultadosDiv.innerHTML = '<p class="alert alert-warning">No se proporcionó un DNI válido.</p>';
    }

    async function buscarRecomendaciones(dni) {
        resultadosDiv.innerHTML = '<div class="text-center p-5"><p>Cargando sus recomendaciones médicas...</p></div>';
        try {
            const response = await fetch(`/getPreventivePlan/${dni}`);
            const data = await response.json();

            if (data.success) {
                // LLAMAMOS A LA FUNCIÓN DE DIBUJO
                mostrarPlanEnHTML(data);
            } else {
                resultadosDiv.innerHTML = `<p class="alert alert-danger">Error: ${data.message || 'No se pudo obtener el plan'}</p>`;
            }
        } catch (error) {
            console.error('Error:', error);
            resultadosDiv.innerHTML = '<p class="alert alert-danger">Error de conexión con el servidor.</p>';
        }
    }

    function mostrarPlanEnHTML(plan) {
        let html = '';

        // Cuadro de Historial
        if (plan.mensajeHistorial) {
            html += `<div style="background-color: #e0f2fe; border-left: 4px solid #0ea5e9; padding: 1rem; margin-bottom: 1.5rem;">
                        <p style="font-weight: bold; color: #0369a1; margin-bottom: 5px;">Historial del Afiliado</p>
                        <p style="color: #075985; margin: 0;">${plan.mensajeHistorial}</p>
                    </div>`;
        }

        // Lista de Recomendaciones
        if (plan.recomendaciones && plan.recomendaciones.length > 0) {
            html += `<h3 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 1rem;">Prácticas Sugeridas:</h3>`;
            html += '<div style="display: grid; gap: 10px;">';
            plan.recomendaciones.forEach(practica => {
                html += `
                    <div style="background: white; padding: 15px; border-radius: 8px; border-left: 5px solid #3b82f6; shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center;">
                        <span style="font-weight: 600; text-transform: uppercase;">${practica}</span>
                    </div>`;
            });
            html += '</div>';
        }

        // Controles Vigentes
        if (plan.controlesVigentes && plan.controlesVigentes.length > 0) {
            html += `<div style="margin-top: 2rem; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 1rem; border-radius: 8px;">
                        <h3 style="color: #166534; font-size: 1.1rem; font-weight: bold;">Controles al Día</h3>
                        <ul style="margin: 0; padding-left: 1.5rem; color: #15803d;">`;
            plan.controlesVigentes.forEach(c => {
                html += `<li>${c.practica || c}</li>`;
            });
            html += '</ul></div>';
        }

        resultadosDiv.innerHTML = html;
        
        // Agregar botón de volver una sola vez
        if (!document.getElementById('volverBtn')) {
            const btnDiv = document.createElement('div');
            btnDiv.style.textAlign = 'center';
            btnDiv.style.marginTop = '2rem';
            btnDiv.innerHTML = `<button id="volverBtn" style="background: #1e3a8a; color: white; padding: 12px 24px; border-radius: 8px; border: none; font-weight: bold; cursor: pointer;">← Volver al Inicio</button>`;
            resultadosDiv.appendChild(btnDiv);
            document.getElementById('volverBtn').onclick = () => window.location.href = 'index.html';
        }
    }
});