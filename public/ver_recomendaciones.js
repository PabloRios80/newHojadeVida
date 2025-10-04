document.addEventListener('DOMContentLoaded', function() {
    const dniInput = document.getElementById('dniBuscar');
    const buscarBtn = document.getElementById('buscarRecomendacionesBtn');
    const resultadosDiv = document.getElementById('resultadosRecomendaciones');

    // Función para obtener el DNI de la URL
    function getDniFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('dni');
    }

    // Si el DNI está en la URL, lo precargamos
    const dniDesdeUrl = getDniFromUrl();
    if (dniDesdeUrl) {
        dniInput.value = dniDesdeUrl;
        buscarRecomendaciones(dniDesdeUrl); // Buscar automáticamente al cargar
    }

    // Evento para el botón "Buscar Recomendaciones"
    buscarBtn.addEventListener('click', function() {
        const dni = dniInput.value;
        if (dni) {
            buscarRecomendaciones(dni);
        } else {
            alert('Por favor, ingresa tu DNI.');
        }
    });

    // Función para buscar y mostrar las recomendaciones
    async function buscarRecomendaciones(dni) {
        resultadosDiv.innerHTML = '<p>Cargando recomendaciones...</p>';
        try {
            const response = await fetch(`/getPreventivePlan/${dni}`);
            if (response.ok) {
                const planPreventivo = await response.json();
                console.log("Plan Preventivo Recibido:", planPreventivo);
                mostrarPlanEnHTML(planPreventivo);
            } else if (response.status === 404) {
                resultadosDiv.innerHTML = '<p>No se encontraron recomendaciones para este DNI.</p>';
            } else {
                resultadosDiv.innerHTML = '<p>Error al obtener las recomendaciones.</p>';
            }
        } catch (error) {
            console.error('Error al solicitar el plan preventivo:', error);
            resultadosDiv.innerHTML = '<p>Error al conectar con el servidor.</p>';
        }
    }
// REEMPLAZA TU FUNCIÓN 'mostrarPlanEnHTML' CON ESTA
function mostrarPlanEnHTML(plan) {

    function mostrarPlanEnHTML(plan) {
    console.log("--- INICIO DEL DIAGNÓSTICO ---");

    if (plan) {
        console.log("El objeto 'plan' fue recibido.");

        // Verificamos la propiedad 'recomendaciones'
        if (plan.recomendaciones) {
            console.log(`Se encontraron ${plan.recomendaciones.length} recomendaciones.`);
            // Usamos JSON.stringify para ver el contenido exacto
            console.log("Contenido de 'recomendaciones':", JSON.stringify(plan.recomendaciones));
        } else {
            console.log("La propiedad 'recomendaciones' NO EXISTE en el objeto.");
        }

        // Verificamos la propiedad 'controlesVigentes'
        if (plan.controlesVigentes) {
            console.log(`Se encontraron ${plan.controlesVigentes.length} controles vigentes.`);
            console.log("Contenido de 'controlesVigentes':", JSON.stringify(plan.controlesVigentes));
        } else {
            console.log("La propiedad 'controlesVigentes' NO EXISTE en el objeto.");
        }

        // Verificamos la propiedad 'mensajeHistorial'
        if (plan.mensajeHistorial) {
            console.log("Mensaje de historial:", plan.mensajeHistorial);
        } else {
            console.log("La propiedad 'mensajeHistorial' NO EXISTE en el objeto.");
        }

    } else {
        console.log("El objeto 'plan' llegó vacío o nulo.");
    }

    console.log("--- FIN DEL DIAGNÓSTICO ---");
    
    // Dejamos la parte visual en blanco por ahora para no generar errores
    const resultadosDiv = document.getElementById('resultadosRecomendaciones');
    resultadosDiv.innerHTML = "<p>Diagnóstico completado. Por favor, revisa la consola (F12).</p>";
}
    // 'plan' es el objeto que recibimos: { mensajeHistorial: "...", recomendaciones: [...] }
    console.log('Plan recibido en el frontend:', plan);
    
    const resultadosDiv = document.getElementById('resultadosRecomendaciones');
    let html = '';

    // 1. Mostramos el mensaje del historial que ahora nos envía el backend
    if (plan.mensajeHistorial) {
        html += `<div style="background-color: #e0f2fe; border-left: 4px solid #0ea5e9; padding: 1rem; margin-bottom: 1.5rem;" role="alert">
                    <p style="font-weight: bold; color: #0369a1;">Historial del Afiliado</p>
                    <p style="color: #075985;">${plan.mensajeHistorial}</p>
                </div>`;
    }

    // 2. Mostramos la lista de recomendaciones
    if (plan.recomendaciones && plan.recomendaciones.length > 0) {
        html += `<h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;">Se recomiendan las siguientes ${plan.recomendaciones.length} prácticas:</h3>`;
        html += '<ul style="list-style: disc; padding-left: 2rem;">';
        
        // Simplemente recorremos la lista de textos y creamos un ítem por cada uno
        plan.recomendaciones.forEach(practica => {
            html += `<li style="margin-bottom: 0.5rem;">${practica}</li>`;
        });

        html += '</ul>';
        }
        
    // Mostramos los Controles Vigentes (en un cuadro de éxito/verde)
    if (plan.controlesVigentes && plan.controlesVigentes.length > 0) {
        html += `<div class="vigentes-box">
                    <h2>Controles Vigentes (Al día)</h2>
                    <ul>`;
        plan.controlesVigentes.forEach(control => {
            html += `<li>${control.practica} <span class="detalle">(Próximo control sugerido: ${control.proximo})</span></li>`;
        });
        html += `</ul></div>`;
    

    if (plan.recomendaciones.length === 0 && plan.controlesVigentes.length === 0) {
        html += '<p>No se encontraron prácticas preventivas aplicables para este perfil.</p>';
    }
    
    resultadosDiv.innerHTML = html;
}
    
    resultadosDiv.innerHTML = html;
   // CREAR BOTÓN CON ESTILOS INLINE (para asegurar que se vea bien)
    const volverButton = document.createElement('div');
    volverButton.style.textAlign = 'center';
    volverButton.style.marginTop = '2rem';
    volverButton.style.marginBottom = '1.5rem';
    
    volverButton.innerHTML = `
        <button id="volverBtn" style="
            background-color: #3b82f6; 
            color: white; 
            padding: 12px 24px; 
            border-radius: 8px; 
            border: none; 
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
        " onmouseover="this.style.backgroundColor='#2563eb'" onmouseout="this.style.backgroundColor='#3b82f6'">
            ← Volver al Inicio
        </button>
    `;
    
    // Insertar el botón antes del footer
    const footer = document.querySelector('footer');
    if (footer) {
        footer.parentNode.insertBefore(volverButton, footer);
    } else {
        // Si no encuentra footer, agregarlo al final del main
        document.querySelector('main').appendChild(volverButton);
    }
        
        
        
        // Configurar el evento para el botón Volver
        const volverBtn = document.getElementById('volverBtn');
        if (volverBtn) {
            volverBtn.addEventListener('click', function() {
                window.location.href = 'index.html'; // Cambia por el nombre de tu página inicial
            });
        }
    }
});