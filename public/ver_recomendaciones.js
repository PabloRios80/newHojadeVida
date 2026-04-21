document.addEventListener('DOMContentLoaded', function () {
  const resultadosDiv = document.getElementById('resultadosRecomendaciones');
  const LINK_RESULTADOS = "https://portal-afiliado-iapos.onrender.com/";

  const urlParams = new URLSearchParams(window.location.search);
  const dniUrl = urlParams.get('dni');

  if (dniUrl) {
    document.getElementById('dniBuscar').value = dniUrl;
    buscarRecomendaciones(dniUrl);
  }

  document.getElementById('buscarRecomendacionesBtn').addEventListener('click', function () {
    const dni = document.getElementById('dniBuscar').value.trim();
    if (!dni) return alert('Por favor ingresá tu DNI.');
    buscarRecomendaciones(dni);
  });

  async function buscarRecomendaciones(dni) {
    resultadosDiv.innerHTML = `
      <div style="text-align:center; padding:2rem;">
        <i class="fas fa-spinner fa-spin fa-2x" style="color:#003366;"></i>
        <p style="margin-top:1rem; color:#666;">Buscando tus recomendaciones...</p>
      </div>`;

    try {
      const response = await fetch(`/getPracticasGuardadas/${dni}`);
      const data = await response.json();

      if (data.success) {
        mostrarRecomendacionesPaciente(data, dni);
      } else {
        resultadosDiv.innerHTML = `
          <div style="background:#fff3cd; border-left:4px solid #ffc107; padding:1.5rem; border-radius:8px; text-align:center;">
            <p style="font-size:1.1rem; color:#856404; margin-bottom:1rem;">
              <i class="fas fa-info-circle"></i> No encontramos recomendaciones guardadas para tu DNI.
            </p>
            <p style="color:#666; margin-bottom:1.5rem;">
              Si ya completaste tu Hoja de Vida, podés generar tus recomendaciones ahora.
            </p>
            <button onclick="generarNuevas('${dni}')"
              style="background:#003366; color:white; padding:12px 28px; border-radius:8px; border:none; font-weight:bold; cursor:pointer; font-size:1rem;">
              <i class="fas fa-sync-alt"></i> Generar Recomendaciones
            </button>
          </div>`;
      }
    } catch (error) {
      resultadosDiv.innerHTML = `
        <div style="background:#fee2e2; border-left:4px solid #ef4444; padding:1rem; border-radius:8px;">
          <p style="color:#991b1b;">Error de conexión. Intentá de nuevo en unos minutos.</p>
        </div>`;
    }
  }

  function mostrarRecomendacionesPaciente(data, dni) {
    let html = '';

    // --- SALUDO ---
    if (data.nombre && data.nombre.trim()) {
      html += `
        <div style="margin-bottom:1.5rem; padding:1rem 1.5rem; background:#f0f7ff; border-radius:10px;">
          <p style="font-size:1.2rem; color:#003366; font-weight:bold; margin:0;">
            <i class="fas fa-user-circle" style="margin-right:8px;"></i>
            Hola, ${data.nombre.trim()}
          </p>
          <p style="color:#555; margin:4px 0 0 0; font-size:0.95rem;">
            Este es tu resumen personalizado del Día Preventivo IAPOS.
          </p>
        </div>`;
    }

    // --- SECCIÓN 1: PENDIENTES ---
    if (data.pendientes && data.pendientes.length > 0) {

      // Agrupamos por subcategoría
      const grupos = {};
      data.pendientes.forEach(p => {
        const grupo = p.subcategoria || 'General';
        if (!grupos[grupo]) grupos[grupo] = [];
        grupos[grupo].push(p);
      });

      html += `
        <div style="margin-bottom:2rem;">
          <h3 style="font-size:1.2rem; font-weight:bold; color:#003366; margin-bottom:1rem; 
                     display:flex; align-items:center; gap:8px; padding-bottom:8px; 
                     border-bottom:2px solid #003366;">
            <i class="fas fa-clipboard-list" style="color:#003366;"></i>
            Te recomendamos realizar
          </h3>`;

      for (const [grupo, practicas] of Object.entries(grupos)) {
        html += `
          <div style="margin-bottom:1rem;">
            <p style="font-size:0.8rem; font-weight:bold; color:#888; text-transform:uppercase; 
                      letter-spacing:1px; margin-bottom:8px;">${grupo}</p>`;

        practicas.forEach(p => {
          const textoUltimaVez = p.ultimaVez 
            ? `<span style="font-size:0.8rem; color:#f59e0b; margin-left:8px;">
                <i class="fas fa-clock"></i> Última vez: ${p.ultimaVez} — venció
               </span>` 
            : '';

          html += `
            <div style="background:white; border-radius:10px; padding:14px 18px; 
                        border-left:5px solid #3b82f6; box-shadow:0 2px 6px rgba(0,0,0,0.07); 
                        margin-bottom:8px; display:flex; align-items:center; gap:12px;">
              <div style="background:#dbeafe; border-radius:50%; width:36px; height:36px; 
                          display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                <i class="fas fa-stethoscope" style="color:#2563eb; font-size:0.9rem;"></i>
              </div>
              <div>
                <p style="font-weight:600; color:#1e3a8a; margin:0; font-size:0.95rem;">
                  ${p.practica}
                </p>
                ${textoUltimaVez}
              </div>
            </div>`;
        });

        html += `</div>`;
      }

      html += `</div>`;
    }

    // --- SECCIÓN 2: AL DÍA ---
    if (data.alDia && data.alDia.length > 0) {
      html += `
        <div style="margin-bottom:2rem;">
          <h3 style="font-size:1.2rem; font-weight:bold; color:#166534; margin-bottom:1rem;
                     display:flex; align-items:center; gap:8px; padding-bottom:8px;
                     border-bottom:2px solid #22c55e;">
            <i class="fas fa-check-circle" style="color:#22c55e;"></i>
            ¡Estás al día con estas prácticas!
          </h3>
          <div style="display:grid; gap:10px;">`;

      data.alDia.forEach(p => {
        html += `
          <div style="background:white; border-radius:10px; padding:14px 18px;
                      border-left:5px solid #22c55e; box-shadow:0 2px 6px rgba(0,0,0,0.07);">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:6px;">
              <div style="background:#dcfce7; border-radius:50%; width:36px; height:36px;
                          display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                <i class="fas fa-check-circle" style="color:#16a34a; font-size:0.9rem;"></i>
              </div>
              <p style="font-weight:600; color:#166534; margin:0; font-size:0.95rem;">
                ${p.practica}
              </p>
            </div>
            <div style="display:flex; gap:20px; padding-left:48px; flex-wrap:wrap;">
              <span style="font-size:0.82rem; color:#555;">
                <i class="fas fa-calendar-check" style="color:#16a34a; margin-right:4px;"></i>
                Realizada: <strong>${p.fechaRealizacion}</strong>
              </span>
              <span style="font-size:0.82rem; color:#555;">
                <i class="fas fa-calendar-alt" style="color:#f59e0b; margin-right:4px;"></i>
                Repetir a partir de: <strong>${p.fechaVencimiento}</strong>
              </span>
            </div>
          </div>`;
      });

      html += `</div></div>`;
    }

    // --- SECCIÓN 3: TUS RESULTADOS ---
    html += `
      <div style="margin-bottom:2rem; background:linear-gradient(135deg, #f0f9ff, #e0f2fe); 
                  border:1px solid #bae6fd; border-radius:12px; padding:1.5rem; text-align:center;">
        <i class="fas fa-file-medical-alt" style="font-size:2rem; color:#0284c7; margin-bottom:8px; display:block;"></i>
        <h3 style="color:#0369a1; font-weight:bold; margin:0 0 6px 0; font-size:1.1rem;">
          Tus Resultados Completos
        </h3>
        <p style="color:#555; margin-bottom:1rem; font-size:0.9rem; line-height:1.5;">
          En el Portal del Afiliado podés ver el detalle de todos tus estudios realizados, 
          informes médicos y resultados con sus conclusiones.
        </p>
        <a href="${LINK_RESULTADOS}" target="_blank"
          style="display:inline-block; background:#0284c7; color:white; padding:10px 28px; 
                 border-radius:8px; text-decoration:none; font-weight:bold; font-size:0.95rem;
                 transition:background 0.2s;">
          <i class="fas fa-external-link-alt" style="margin-right:6px;"></i> 
          Ver mis resultados en el Portal
        </a>
      </div>`;

    // --- BOTÓN ACTUALIZAR ---
    html += `
      <div style="text-align:center; padding-top:1rem; border-top:1px solid #e5e7eb;">
        <p style="color:#888; font-size:0.82rem; margin-bottom:10px;">
          ¿Actualizaste tus datos de salud recientemente?
        </p>
        <button onclick="generarNuevas('${dni}')"
          style="background:white; color:#003366; border:2px solid #003366; padding:9px 22px; 
                 border-radius:8px; font-weight:bold; cursor:pointer; font-size:0.88rem;">
          <i class="fas fa-sync-alt" style="margin-right:6px;"></i> Actualizar recomendaciones
        </button>
      </div>`;

    resultadosDiv.innerHTML = html;
  }

  // --- REGENERAR ---
  window.generarNuevas = async function (dni) {
    resultadosDiv.innerHTML = `
      <div style="text-align:center; padding:2rem;">
        <i class="fas fa-spinner fa-spin fa-2x" style="color:#003366;"></i>
        <p style="margin-top:1rem; color:#666;">Generando tus recomendaciones personalizadas...</p>
      </div>`;

    try {
      const response = await fetch(`/getPreventivePlan/${dni}`);
      const data = await response.json();

      if (data.success && !data.anioNoCumplido) {
        const response2 = await fetch(`/getPracticasGuardadas/${dni}`);
        const data2 = await response2.json();
        if (data2.success) {
          mostrarRecomendacionesPaciente(data2, dni);
        }
      } else if (data.anioNoCumplido) {
        // No pasó un año — mostramos igual lo que hay guardado
        const response2 = await fetch(`/getPracticasGuardadas/${dni}`);
        const data2 = await response2.json();
        if (data2.success) {
          mostrarRecomendacionesPaciente(data2, dni);
        }
      } else {
        resultadosDiv.innerHTML = `
          <div style="background:#fee2e2; border-left:4px solid #ef4444; padding:1rem; border-radius:8px;">
            <p style="color:#991b1b;">${data.mensaje || 'No se pudieron generar las recomendaciones.'}</p>
          </div>`;
      }
    } catch (error) {
      resultadosDiv.innerHTML = `
        <div style="background:#fee2e2; border-left:4px solid #ef4444; padding:1rem; border-radius:8px;">
          <p style="color:#991b1b;">Error de conexión. Intentá de nuevo.</p>
        </div>`;
    }
  };
});