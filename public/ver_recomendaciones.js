document.addEventListener('DOMContentLoaded', function () {
  const resultadosDiv = document.getElementById('resultadosRecomendaciones');
  const LINK_RESULTADOS = "https://portal-afiliado-iapos.onrender.com/";

  const GRUPOS = [
    {
      id: 'cardiovascular',
      titulo: 'Cardiovascular',
      subtitulo: 'Presión arterial, colesterol, riesgo cardíaco',
      icono: 'fas fa-heart-pulse',
      color: '#fee2e2', colorIcono: '#dc2626', colorTitulo: '#991b1b',
      practicas: ['tomar ta ambos brazos personal capacitado','colesterol total, hdl/colesterol, ldl/colesterol, trigliceridos','ldl/colesterol','estratificacion riesgo cv','aspirina']
    },
    {
      id: 'metabolico',
      titulo: 'Metabólico',
      subtitulo: 'Glucemia, diabetes, dislipemias',
      icono: 'fas fa-droplet',
      color: '#fef3c7', colorIcono: '#d97706', colorTitulo: '#92400e',
      practicas: ['glucemia en ayunas','dislipemias','diabetes','imc','calcular imc']
    },
    {
      id: 'oncologico',
      titulo: 'Oncológico',
      subtitulo: 'Detección temprana de cáncer',
      icono: 'fas fa-ribbon',
      color: '#fce7f3', colorIcono: '#db2777', colorTitulo: '#9d174d',
      practicas: ['papanicolau','test hpv','mamografia','ecografia mamaria','antigeno prostatico especifico total - psa','sangre oculta en materia fecal - somf','videocolonoscopia - vcc','cancer piel','control piel']
    },
    {
      id: 'infeccioso',
      titulo: 'Infeccioso',
      subtitulo: 'Detección de infecciones',
      icono: 'fas fa-virus',
      color: '#dcfce7', colorIcono: '#16a34a', colorTitulo: '#166534',
      practicas: ['anticuerpos anti_vih','hepatitis b antigeno de superficie_aghb','hepatitis b anti core','hepatitis c _hcv_ac_igg','vdrl','test chagas']
    },
    {
      id: 'vacunas',
      titulo: 'Vacunas',
      subtitulo: 'Inmunizaciones recomendadas',
      icono: 'fas fa-syringe',
      color: '#e0e7ff', colorIcono: '#4f46e5', colorTitulo: '#3730a3',
      practicas: ['vacunas','inmunizaciones']
    },
    {
      id: 'respiratorio',
      titulo: 'Respiratorio',
      subtitulo: 'Pulmones y circulación',
      icono: 'fas fa-lungs',
      color: '#e0f2fe', colorIcono: '#0284c7', colorTitulo: '#0c4a6e',
      practicas: ['espirometria','epoc','ecografia abdominal','aneurisma aorta']
    },
    {
      id: 'renal',
      titulo: 'Salud Renal',
      subtitulo: 'Función renal',
      icono: 'fas fa-flask',
      color: '#f0fdf4', colorIcono: '#059669', colorTitulo: '#065f46',
      practicas: ['creatinina, formula filtrado glomerular','filtrado glomerular','creatinina']
    },
    {
      id: 'habitos',
      titulo: 'Hábitos',
      subtitulo: 'IMC, tabaco, actividad física',
      icono: 'fas fa-person-running',
      color: '#fff7ed', colorIcono: '#ea580c', colorTitulo: '#7c2d12',
      practicas: ['calcular imc','imc','consejeria/tratamiento tabaquismo','consejeria actividad fisica','sedentarismo']
    },
    {
      id: 'bucal',
      titulo: 'Salud Bucal',
      subtitulo: 'Control odontológico',
      icono: 'fas fa-tooth',
      color: '#f0f9ff', colorIcono: '#0369a1', colorTitulo: '#0c4a6e',
      practicas: ['control odontologico']
    },
    {
      id: 'tercera_edad',
      titulo: 'Cuidado de la tercera edad',
      subtitulo: 'Osteoporosis y prevención de caídas',
      icono: 'fas fa-person-cane',
      color: '#faf5ff', colorIcono: '#7c3aed', colorTitulo: '#4c1d95',
      practicas: ['densitometria osea','consejeria/tratamiento caida adultos mayores','caidas']
    },
    {
      id: 'mental',
      titulo: 'Salud Mental',
      subtitulo: 'Depresión, violencia, adicciones',
      icono: 'fas fa-brain',
      color: '#fdf4ff', colorIcono: '#a21caf', colorTitulo: '#701a75',
      practicas: ['consejeria/tratamiento depresion','consejeria/tratamiento alcohol y/o drogas','consejeria/tratamiento violencia familiar']
    },
    {
      id: 'vision',
      titulo: 'Visión',
      subtitulo: 'Control visual',
      icono: 'fas fa-eye',
      color: '#f0fdfa', colorIcono: '#0d9488', colorTitulo: '#134e4a',
      practicas: ['control vision','agudeza visual']
    }
  ];

  const normalizar = t => (t||'').toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();

  function asignarGrupo(practica) {
    const norm = normalizar(practica);
    for (const g of GRUPOS) {
      if (g.practicas.some(p => norm.includes(normalizar(p)) || normalizar(p).includes(norm))) {
        return g.id;
      }
    }
    return 'otros';
  }

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

  document.getElementById('dniBuscar').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      const dni = this.value.trim();
      if (dni) buscarRecomendaciones(dni);
    }
  });

  async function buscarRecomendaciones(dni) {
    resultadosDiv.innerHTML = `
      <div class="spinner-box">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Buscando tus recomendaciones...</p>
      </div>`;

    try {
      const response = await fetch('/getPracticasGuardadas/' + dni);
      const data = await response.json();

      if (data.success) {
        mostrarRecomendaciones(data, dni);
      } else {
        resultadosDiv.innerHTML = `
          <div class="card" style="text-align:center;">
            <i class="fas fa-info-circle" style="font-size:2rem; color:#f59e0b; margin-bottom:12px; display:block;"></i>
            <p style="font-size:16px; color:#92400e; font-weight:600; margin-bottom:8px;">No encontramos recomendaciones para tu DNI.</p>
            <p style="font-size:14px; color:#64748b; margin-bottom:20px;">Si completaste tu Hoja de Vida podés generar tus recomendaciones ahora.</p>
            <button onclick="generarNuevas('${dni}')" class="btn-buscar" style="margin:0 auto;">
              <i class="fas fa-sync-alt"></i> Generar recomendaciones
            </button>
          </div>`;
      }
    } catch (error) {
      resultadosDiv.innerHTML = `
        <div class="card" style="border-left: 4px solid #ef4444;">
          <p style="color:#991b1b; font-size:14px;"><i class="fas fa-exclamation-triangle" style="margin-right:6px;"></i>Error de conexión. Intentá de nuevo en unos minutos.</p>
        </div>`;
    }
  }

  function mostrarRecomendaciones(data, dni) {
    const nombre = (data.nombre || '').trim();
    const pendientes = data.pendientes || [];
    const alDia = data.alDia || [];
    const total = pendientes.length + alDia.length;

    let html = '';

    // BIENVENIDA
    html += `
      <div class="welcome-box">
        <p class="welcome-name"><i class="fas fa-user-circle" style="margin-right:8px; opacity:0.8;"></i>${nombre || 'Afiliado/a'}</p>
        <p class="welcome-sub">Este es tu resumen personalizado del Día Preventivo IAPOS.</p>
      </div>`;

    // EXPLICACIÓN
    html += `
      <div class="explicacion-box">
        <p>Las prácticas que ves a continuación fueron seleccionadas <strong>especialmente para vos</strong> en base a tu edad, sexo biológico y antecedentes personales y familiares. Todas están <strong>basadas en la evidencia médica más reciente</strong> y se encuentran en este momento <strong>autorizadas sin cargo</strong> para que las realices en el marco del Día Preventivo a la brevedad.</p>
      </div>`;

    // CHIPS RESUMEN
    html += `<div class="resumen-row">`;
    if (pendientes.length > 0) {
      html += `<div class="resumen-chip chip-pendiente"><i class="fas fa-clipboard-list"></i> ${pendientes.length} práctica${pendientes.length > 1 ? 's' : ''} recomendada${pendientes.length > 1 ? 's' : ''}</div>`;
    }
    if (alDia.length > 0) {
      html += `<div class="resumen-chip chip-aldia"><i class="fas fa-check-circle"></i> ${alDia.length} al día</div>`;
    }
    html += `</div>`;

    // AGRUPAR PENDIENTES
    if (pendientes.length > 0) {
      html += `<h3 style="font-size:17px; font-weight:700; color:#0448a2; margin-bottom:14px; display:flex; align-items:center; gap:8px;">
        <i class="fas fa-clipboard-list"></i> Te recomendamos realizar
      </h3>`;

      const porGrupo = {};
      pendientes.forEach(p => {
        const gid = asignarGrupo(p.practica);
        if (!porGrupo[gid]) porGrupo[gid] = [];
        porGrupo[gid].push(p);
      });

      GRUPOS.forEach(g => {
        if (!porGrupo[g.id]) return;
        html += renderGrupo(g, porGrupo[g.id], false);
      });

      if (porGrupo['otros']) {
        html += renderGrupoOtros(porGrupo['otros'], false);
      }
    }

    // AGRUPAR AL DÍA
    if (alDia.length > 0) {
      html += `<h3 style="font-size:17px; font-weight:700; color:#166534; margin: 24px 0 14px; display:flex; align-items:center; gap:8px;">
        <i class="fas fa-check-circle" style="color:#16a34a;"></i> ¡Estás al día con estas prácticas!
      </h3>`;

      const porGrupoAD = {};
      alDia.forEach(p => {
        const gid = asignarGrupo(p.practica);
        if (!porGrupoAD[gid]) porGrupoAD[gid] = [];
        porGrupoAD[gid].push(p);
      });

      GRUPOS.forEach(g => {
        if (!porGrupoAD[g.id]) return;
        html += renderGrupo(g, porGrupoAD[g.id], true);
      });

      if (porGrupoAD['otros']) {
        html += renderGrupoOtros(porGrupoAD['otros'], true);
      }
    }

    // PORTAL
    html += `
      <div class="portal-box">
        <i class="fas fa-file-medical-alt" style="font-size:2rem; color:#0448a2; margin-bottom:10px; display:block;"></i>
        <h3>Tus resultados completos</h3>
        <p>En el Portal del Afiliado podés ver el detalle de todos tus estudios, informes médicos y resultados con sus conclusiones.</p>
        <a href="${LINK_RESULTADOS}" target="_blank" class="btn-portal">
          <i class="fas fa-external-link-alt"></i> Ver mis resultados en el Portal
        </a>
      </div>`;

    // ACTUALIZAR
    html += `
      <div class="actualizar-row">
        <p style="font-size:13px; color:#94a3b8; margin-bottom:10px;">¿Actualizaste tus datos de salud recientemente?</p>
        <button onclick="generarNuevas('${dni}')" class="btn-actualizar">
          <i class="fas fa-sync-alt"></i> Actualizar recomendaciones
        </button>
      </div>`;

    resultadosDiv.innerHTML = html;
  }

  function renderGrupo(g, practicas, esAlDia) {
    let html = `
      <div class="card" style="margin-bottom:14px;">
        <div class="grupo-header">
          <div class="grupo-icon" style="background:${g.color};">
            <i class="${g.icono}" style="color:${g.colorIcono};"></i>
          </div>
          <div>
            <p class="grupo-titulo" style="color:${g.colorTitulo};">${g.titulo}</p>
            <p class="grupo-subtitulo">${g.subtitulo}</p>
          </div>
        </div>`;

    practicas.forEach(p => {
      if (esAlDia) {
        html += `
          <div class="practica-item item-aldia">
            <div class="practica-badge"><i class="fas fa-check-circle"></i></div>
            <div class="practica-texto">
              <p class="practica-nombre">${p.practica}</p>
              <div class="practica-detalle">
                <span><i class="fas fa-calendar-check" style="color:#16a34a;"></i> Realizada: <strong>${p.fechaRealizacion}</strong></span>
                <span><i class="fas fa-calendar-alt" style="color:#f59e0b;"></i> Repetir a partir de: <strong>${p.fechaVencimiento}</strong></span>
              </div>
            </div>
          </div>`;
      } else if (p.ultimaVez) {
        html += `
          <div class="practica-item item-vencido">
            <div class="practica-badge"><i class="fas fa-clock"></i></div>
            <div class="practica-texto">
              <p class="practica-nombre">${p.practica}</p>
              <div class="practica-detalle">
                <span><i class="fas fa-calendar-times" style="color:#d97706;"></i> Última vez: ${p.ultimaVez} — venció</span>
              </div>
            </div>
          </div>`;
      } else {
        html += `
          <div class="practica-item item-pendiente">
            <div class="practica-badge"><i class="fas fa-stethoscope"></i></div>
            <div class="practica-texto">
              <p class="practica-nombre">${p.practica}</p>
              <div class="practica-detalle">
                <span style="color:#0448a2;"><i class="fas fa-circle-check"></i> Autorizada sin cargo en el Día Preventivo</span>
              </div>
            </div>
          </div>`;
      }
    });

    html += `</div>`;
    return html;
  }

  function renderGrupoOtros(practicas, esAlDia) {
    const g = { titulo: 'Otros', subtitulo: 'Prácticas adicionales', icono: 'fas fa-notes-medical', color: '#f1f5f9', colorIcono: '#64748b', colorTitulo: '#475569' };
    return renderGrupo(g, practicas, esAlDia);
  }

  window.generarNuevas = async function (dni) {
    resultadosDiv.innerHTML = `
      <div class="spinner-box">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Generando tus recomendaciones personalizadas...</p>
      </div>`;

    try {
      const response = await fetch('/getPreventivePlan/' + dni);
      const data = await response.json();

      const response2 = await fetch('/getPracticasGuardadas/' + dni);
      const data2 = await response2.json();
      if (data2.success) {
        mostrarRecomendaciones(data2, dni);
      } else {
        resultadosDiv.innerHTML = `
          <div class="card" style="border-left:4px solid #ef4444;">
            <p style="color:#991b1b;">${data.message || 'No se pudieron generar las recomendaciones.'}</p>
          </div>`;
      }
    } catch (error) {
      resultadosDiv.innerHTML = `
        <div class="card" style="border-left:4px solid #ef4444;">
          <p style="color:#991b1b; font-size:14px;">Error de conexión. Intentá de nuevo.</p>
        </div>`;
    }
  };
});