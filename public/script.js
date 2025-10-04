async function guardarDatosFormulario() {
    const DNI = document.getElementById('dni').value;
    const fechaDeNacimiento = document.getElementById('birthDate').value; 
    const apellido = document.getElementById('apellido').value; // Nuevo campo
    const nombre = document.getElementById('nombre').value;     // Nuevo campo
    const edad = document.getElementById('age').value; 
    const email = document.getElementById('email').value;
    const telefono = document.getElementById('phone').value;  
    const sexo_biologico = document.querySelector('input[name="biologicalSex"]:checked').value;
    const genero_autopercibido = document.getElementById('genderIdentity').value;
    const altura = document.getElementById('height').value;
    const peso = document.getElementById('weight').value;

    // Capturamos el valor del IMC directamente del span
    const bmiValor = document.getElementById('bmiValue').textContent;
    // Capturamos la categoría del IMC directamente del span
    const bmiCategoria = document.getElementById('bmiCategory').textContent;

    const hipertension = document.querySelector('input[name="hypertension"]:checked').value;
    const diabetes = document.querySelector('input[name="diabetes"]:checked').value;
    const colesterol = document.querySelector('input[name="cholesterol"]:checked').value;
    const depresion = document.querySelector('input[name="depression"]:checked').value;
    const actividad_fisica = document.querySelector('input[name="physicalActivityLow"]:checked').value;
    const sedentarismo = document.querySelector('input[name="sedentary"]:checked').value;
    const abuso_alcohol_otros = document.querySelector('input[name="drugUseExcessive"]:checked').value;
    const stress_ansiedad = document.querySelector('input[name="stressAnxietyExcessive"]:checked').value;
    const preocupacion_salud = document.querySelector('input[name="healthConcernExcessive"]:checked').value;
    const abuso_pantallas = document.querySelector('input[name="screenTimeExcessive"]:checked').value;

    const tabaquismoElement = document.querySelector('input[name="smokingStatus"]:checked');
    const tabaquismo = tabaquismoElement ? tabaquismoElement.value : '';

     let fumador_cronico = 'No aplica'; // Valor por defecto

    // Solo buscar fumador_cronico si es fumador o ex-fumador
    if (tabaquismo === 'Sí' || tabaquismo === 'Ex fumador') {
        const fumadorCronicoElement = document.querySelector('input[name="smokingDuration"]:checked');
        if (fumadorCronicoElement) {
        fumador_cronico = fumadorCronicoElement.value;
        }
    }

    const hipertension_familiar = document.querySelector('input[name="familiarHipertension"]:checked').value;
    const diabetes_familiar = document.querySelector('input[name="familiarDiabetes"]:checked').value;
    const adicciones_familiar = document.querySelector('input[name="familiarAdicciones"]:checked').value;
    const obesidad_familiar = document.querySelector('input[name="familiarObesidad"]:checked').value;
    const depresion_familiar = document.querySelector('input[name="familiarDepresion"]:checked').value;
    const violencia_familiar = document.querySelector('input[name="familiarViolenciaAbuso"]:checked').value;
    const cancer_de_colon = document.querySelector('input[name="colonCancer"]:checked').value;
    const cancer_de_mama = document.querySelector('input[name="breastCancer"]:checked').value;
    const cancer_de_cuello_utero = document.querySelector('input[name="cervicalCancer"]:checked').value;
    const cancer_de_prostata = document.querySelector('input[name="prostateCancer"]:checked').value;
    
    const formData = {
        dni: DNI,
        fecha_nacimiento: fechaDeNacimiento, 
        apellido: apellido,
        nombre: nombre,
        edad: edad,
        email: email,
        telefono: telefono,
        sexo_biologico: sexo_biologico,
        genero_autopercibido: genero_autopercibido,
        altura: altura,
        peso: peso,
        bmi: bmiValor,
        categoria_bmi: bmiCategoria,
        hipertension: hipertension,
        diabetes: diabetes,
        colesterol: colesterol,
        depresion: depresion,
        actividad_fisica: actividad_fisica, // Corregido
        sedentarismo: sedentarismo,
        abuso_alcohol_drogas: abuso_alcohol_otros, // Corregido
        stress: stress_ansiedad,
        exceso_preocupacion_salud: preocupacion_salud, // Corregido
        exceso_pantalla: abuso_pantallas, // Corregido (pantalla en singular)
        fuma: tabaquismo,
        fumador_cronico: fumador_cronico,
        hipertension_familiar: hipertension_familiar,
        diabetes_familiar: diabetes_familiar,
        adicciones_familiar: adicciones_familiar,
        obesidad_familiar: obesidad_familiar,
        depresion_familiar: depresion_familiar,
        violencia_familiar: violencia_familiar,
        cancer_de_colon: cancer_de_colon,
        cancer_de_mama: cancer_de_mama,
        cancer_cuello_utero: cancer_de_cuello_utero,
        cancer_de_prostata: cancer_de_prostata
    };
    try {
        const response = await fetch('/saveData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        if (response.ok) {
            alert('Datos guardados correctamente.');
            // Redirigir a la nueva página para ver recomendaciones, pasando el DNI como parámetro
            window.location.href = `ver_recomendaciones.html?dni=${DNI}`;
        } else {
            alert('Error al guardar datos. Inténtalo de nuevo.');
        }
    } catch (error) {
        console.error('Error al guardar datos:', error);
        alert('Error al guardar datos. Inténtalo de nuevo.');
    }
}

// Función para calcular el IMC
function calculateBMI() {
    const height = parseFloat(document.getElementById('height').value) / 100; // Convertir a metros
    const weight = parseFloat(document.getElementById('weight').value);

    if (height && weight) {
        const bmi = weight / (height * height);
        document.getElementById('bmiValue').textContent = bmi.toFixed(2);

        let category = '';
        if (bmi < 18.5) {
            category = 'Bajo peso';
            document.getElementById('bmiCategory').className = 'ml-2 text-sm px-2 py-1 rounded-full bg-yellow-200 text-yellow-800';
        } else if (bmi < 25) {
            category = 'Peso normal';
            document.getElementById('bmiCategory').className = 'ml-2 text-sm px-2 py-1 rounded-full bg-green-200 text-green-800';
        } else if (bmi < 30) {
            category = 'Sobrepeso';
            document.getElementById('bmiCategory').className = 'ml-2 text-sm px-2 py-1 rounded-full bg-orange-200 text-orange-800';
        } else {
            category = 'Obesidad';
            document.getElementById('bmiCategory').className = 'ml-2 text-sm px-2 py-1 rounded-full bg-red-200 text-red-800';
        }
        document.getElementById('bmiCategory').textContent = category;
    } else {
        document.getElementById('bmiValue').textContent = '--';
        document.getElementById('bmiCategory').textContent = '';
    }
}
function calculateAge() {
    const birthDate = document.getElementById('birthDate').value;
    const parts = birthDate.split('/');

    if (parts.length !== 3) {
        document.getElementById('age').value = ''; // Fecha inválida
        return;
    }

    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Meses en JavaScript son 0-11
    const year = parseInt(parts[2]);

    const today = new Date();
    const birthDateObj = new Date(year, month, day);

    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
        age--;
    }

    document.getElementById('age').value = age;
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('birthDate').addEventListener('change', calculateAge);

    document.getElementById('height').addEventListener('input', calculateBMI);
    document.getElementById('weight').addEventListener('input', calculateBMI);

    // Tu código existente para iniciar el cuestionario
    const startQuestionnaireButton = document.getElementById('startQuestionnaireButton');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const mainForm = document.getElementById('mainForm');
    if (startQuestionnaireButton && welcomeScreen && mainForm) {
        startQuestionnaireButton.addEventListener('click', function() {
            console.log('Función startQuestionnaire ejecutada');
            welcomeScreen.classList.add('hidden');
            mainForm.classList.remove('hidden');
            showStep(currentStep); // Mostrar el primer paso al iniciar
            updateProgress();
        });
    } else {
        console.error("Elementos de inicio del cuestionario no encontrados.");
    }
    // Tu código existente para guardar los datos del formulario
    const submitBtn = document.getElementById('submitBtn'); // Asumiendo que tienes un botón de envío final
    if (submitBtn) {
        submitBtn.addEventListener('click', function(event) {
            event.preventDefault();
            guardarDatosFormulario();
        });
    }

    // Elementos para la navegación entre pasos
    const formSteps = document.querySelectorAll('.form-step');
    const prevBtns = document.querySelectorAll('[id^="prevBtn"]');
    const nextBtns = document.querySelectorAll('[id^="nextBtn"]');
    const formProgress = document.getElementById('formProgress'); // Asegúrate de tener este elemento en tu HTML
    let currentStep = 0;

    function updateProgress() {
        if (formProgress) {
            formProgress.style.width = `${((currentStep + 1) / formSteps.length) * 100}%`;
        }
    }

    function showStep(stepIndex) {
        formSteps.forEach((step, index) => {
            step.classList.toggle('hidden', index !== stepIndex);
        });
        updateProgress();
    }

    // Mostrar el primer paso al cargar la página si no hay pantalla de bienvenida
    if (formSteps.length > 0 && !document.getElementById('welcomeScreen')) {
        showStep(currentStep);
        updateProgress();
    } else if (mainForm && !mainForm.classList.contains('hidden')) {
        showStep(currentStep);
        updateProgress();
    } else {
        // Si hay pantalla de bienvenida, el primer paso se mostrará al iniciar
        formSteps.forEach((step, index) => {
            step.classList.add('hidden');
        });
    }


    nextBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (currentStep < formSteps.length - 1) {
                currentStep++;
                showStep(currentStep);
            }
        });
    });

    prevBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (currentStep > 0) {
                currentStep--;
                showStep(currentStep);
            }
        });
    });

    function startQuestionnaire() {
        console.log('Función startQuestionnaire ejecutada');
        document.getElementById('welcomeScreen').classList.add('hidden');
        document.getElementById('mainForm').classList.remove('hidden');
        document.getElementById('formProgress').style.width = '20%';
        currentStep = 0; // Asegurarnos de que la variable currentStep esté en 0
        showStep(currentStep); // Llamar a showStep para mostrar el primer paso
    }
        // Configurar el evento click para el botón "Guardar y Continuar"
    const saveButton = document.getElementById('saveButton');
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            guardarDatosFormulario(); // Llama a la función para guardar los datos.

            // Ocultar todos los pasos del formulario
            const formSteps = document.querySelectorAll('.form-step');
            formSteps.forEach(step => step.classList.add('hidden'));

            // Ocultar el botón "Anterior" (si aún existe en el HTML)
            const prevBtn = document.getElementById('prevBtn');
            if (prevBtn) {
                prevBtn.classList.add('hidden');
            }

            // Mostrar la sección de resultados
            const resultsSection = document.getElementById('resultsSection');
            if (resultsSection) {
                resultsSection.classList.remove('hidden');

                // **OCULTAR el botón "Guardar y Continuar" cuando se muestra la sección de resultados**
                saveButton.classList.add('hidden');
            } else {
                console.error('No se encontró el elemento resultsSection.');
            }
        });
    }
    // ** NUEVO CÓDIGO PARA VERIFICAR EL DNI AL PERDER EL FOCO **
    const dniInputHojaDeVida = document.getElementById('dni'); // Asegúrate de que este sea el ID del campo DNI en tu formulario "Hoja de Vida"
    if (dniInputHojaDeVida) {
        dniInputHojaDeVida.addEventListener('blur', async function() {
            const dni = this.value.trim();
            if (dni.length >= 7) {
                try {
                    const response = await fetch('/checkDNI', { // Usamos la ruta /checkDNI que crearemos en el servidor
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ dni: dni })
                    });
                    const data = await response.json();
                    if (data.exists) {
                        // El DNI ya existe, mostrar el cartel
                        const dniExistenteMessage = document.createElement('div');
                        dniExistenteMessage.classList.add('text-yellow-500', 'mt-2');
                        dniExistenteMessage.textContent = `¡Atención! El DNI ${dni} ya está registrado con el nombre ${data.nombre} ${data.apellido} y fecha de nacimiento ${data.fechaDeNacimiento}. Puede continuar.`;
                        this.parentNode.appendChild(dniExistenteMessage);
                        const nombreInput = document.getElementById('nombre');
                        const apellidoInput = document.getElementById('apellido');
                        const birthDateInput = document.getElementById('birthDate');
                        const ageInput = document.getElementById('age'); // Obtén el campo de edad
                    
                        if (nombreInput && apellidoInput && birthDateInput && ageInput) {
                            nombreInput.value = data.nombre;
                            apellidoInput.value = data.apellido;
                            birthDateInput.value = data.fechaDeNacimiento;
                    
                            // **DISPARAR MANUALMENTE EL EVENTO CHANGE PARA CALCULAR LA EDAD**
                            const changeEvent = new Event('change');
                            birthDateInput.dispatchEvent(changeEvent);
                        }

                    } else {
                        // El DNI no existe, limpiar cualquier mensaje previo
                        const mensajeExistente = this.parentNode.querySelector('.text-yellow-500');
                        if (mensajeExistente) {
                            mensajeExistente.remove();
                        }
                    }
                } catch (error) {
                    console.error('Error al verificar el DNI:', error);
                    // Opcionalmente mostrar un mensaje de error al usuario
                }
            }
        });
    }


    // =========================================================================
    // NUEVA FUNCIÓN PARA MOSTRAR LAS RECOMENDACIONES
    // =========================================================================

    async function mostrarRecomendaciones() {
        const dni = document.getElementById('dni').value; // O la forma en que identifiques al usuario

        if (dni) {
            try {
                const response = await fetch(`http://localhost:3001/getPreventivePlan/${dni}`); // Cambia el puerto a 3001
                if (response.ok) {
                    const planPreventivo = await response.json();
                    console.log("Plan Preventivo Recibido:", planPreventivo);
                    mostrarPlanEnHTML(planPreventivo);
                } else if (response.status === 404) {
                    alert('Usuario no encontrado.');
                } else {
                    alert('Error al obtener las recomendaciones.');
                }
            } catch (error) {
                console.error('Error al solicitar el plan preventivo:', error);
                alert('Error al solicitar las recomendaciones.');
            }
        } else {
            alert('Por favor, ingrese su DNI para ver las recomendaciones.');
        }
    }
    function mostrarPlanEnHTML(plan) {
        console.log('Plan recibido en el frontend:', plan);
        document.getElementById('resultName').textContent = plan.name;
        document.getElementById('resultDNI').textContent = document.getElementById('dni').value;
        document.getElementById('resultAge').textContent = plan.age;
        document.getElementById('resultSex').textContent = plan.sex;
        document.getElementById('resultBMICategory').textContent = plan.bmiCategory;
    
        const recommendationsByCategoryContainer = document.getElementById('recommendationsByCategory');
        recommendationsByCategoryContainer.innerHTML = ''; // Limpiar contenido anterior
    
        // Agrupar recomendaciones por categoría
        const recommendationsPorCategoria = {};
        plan.recommendations.forEach(recommendation => {
            if (!recommendationsPorCategoria[recommendation.categoria]) {
                recommendationsPorCategoria[recommendation.categoria] = [];
            }
            recommendationsPorCategoria[recommendation.categoria].push(recommendation);
        });
    
        // Crear y agregar secciones por categoría al HTML
        for (const categoria in recommendationsPorCategoria) {
            if (recommendationsPorCategoria.hasOwnProperty(categoria)) {
                const categoriaSection = document.createElement('div');
                categoriaSection.classList.add('mb-8'); // Espacio entre categorías
    
                const categoriaTitulo = document.createElement('h2');
                categoriaTitulo.classList.add('text-2xl', 'font-semibold', 'text-gray-800', 'mb-4');
                categoriaTitulo.textContent = categoria;
                categoriaSection.appendChild(categoriaTitulo);
    
                recommendationsPorCategoria[categoria].forEach(recommendation => {
                    const recommendationItem = document.createElement('div');
                    recommendationItem.classList.add('flex', 'items-start', 'p-4', 'bg-green-50', 'rounded-lg', 'mb-2');
                    recommendationItem.innerHTML = `
                        <i class="fas fa-check-circle text-secondary mt-1 mr-3"></i>
                        <div>
                            <p class="text-sm text-gray-800">${recommendation.practica}</p>
                            <button class="text-xs text-primary mt-1" data-explicativo-id="${recommendation.explicativo_id}">Conozca más sobre esto</button>
                        </div>
                    `;
                    categoriaSection.appendChild(recommendationItem);
                });
    
                recommendationsByCategoryContainer.appendChild(categoriaSection);
            }
        }
    
        document.getElementById('resultsSection').classList.remove('hidden');
    }
    // Agrega un event listener a un botón para mostrar las recomendaciones
    const showRecommendationsButton = document.getElementById('showRecommendationsButton'); // Asegúrate de tener este botón en tu HTML
    if (showRecommendationsButton) {
        showRecommendationsButton.addEventListener('click', mostrarRecomendaciones);
    }
});

