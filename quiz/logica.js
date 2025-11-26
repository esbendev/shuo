let pregunta; // Declare pregunta in the outer scope
let cantidadPreguntas = 0;
let preguntasEstado = [];
let currentId = 1;
let audioActual = 0;

// get filename from URL params
const urlParams = new URLSearchParams(window.location.search);
const filename = urlParams.get('file') || '';
const tituloQuiz = document.querySelector('.titulo-quiz');
const instrucciones = document.querySelector('.instrucciones');
const botonAyuda = document.querySelector('.boton-ayuda');

if (filename == '') {
    // redirect to ../index.html if no file param
    window.location.href = '../index.html';
}

// Check localStorage for existing currentId for this filename
const storageKey = `quiz_currentId_${filename}`;
const storedId = localStorage.getItem(storageKey);
if (storedId) {
    currentId = parseInt(storedId, 10);
}

// cargo archivo con audio, respuesta correcta y teclado
// por ahora estoy patcheando esto para que funcione con 1 y 2...
// si hay más cosas en el futuro, veremos :)
const filePath = filename.includes('tubh1_') 
    ? `../contenido/preguntas/tubh/1/${filename}.json` 
    : `../contenido/preguntas/tubh/2/${filename}.json`;
fetch(filePath)
    .then(response => response.json())
    .then(data => {
        preguntasEstado = data.preguntas.map(p => ({
            id: p.id,
            value: p.id < currentId ? 1 : 0
        }));

        pregunta = data.preguntas.find(p => p.id === currentId);
        if (!pregunta || !pregunta.input_chars_aceptados) return;

        tituloQuiz.textContent = data.titulo;

        instrucciones.innerHTML = pregunta.instrucciones;
        audioActual = 0;
        cargarBotonAudio();
        mostrarBotonAyuda(data.showHelp);

        actualizarTeclado();

        cantidadPreguntas = data.preguntas.length;

        // save cantidadPreguntas to localStorage for this filename
        localStorage.setItem(`quiz_cantidadPreguntas_${filename}`, cantidadPreguntas);
        actualizarListaDePreguntas();
    });

function mostrarBotonAyuda(mostrar) {
    if (mostrar) {
        botonAyuda.classList.remove('boton-ayuda--esconder');
    } else {
        botonAyuda.classList.add('boton-ayuda--esconder');
    }
}

function actualizarListaDePreguntas() {
    const lista = document.querySelector('.lista-de-preguntas');
    lista.innerHTML = '';
    for (let i = 1; i <= cantidadPreguntas; i++) {
        const item = document.createElement('div');
        item.className = 'pregunta-item';
        item.textContent = `${i}`;
        const estado = preguntasEstado.find(p => p.id === i);
        if (estado && estado.value === 1) {
            item.classList.add('respuesta-correcta');
        }
        if (pregunta && pregunta.id === i) {
            item.classList.add('pregunta-item--actual');
        }
        lista.appendChild(item);
    }
    // Save currentId to localStorage for this filename
    localStorage.setItem(`quiz_currentId_${filename}`, currentId);
}

function actualizarTeclado() {
    if (!pregunta || !pregunta.input_chars_aceptados) return;
    const keys = pregunta.input_chars_aceptados;
    const keyboard = document.querySelector('.teclado-respuestas');
    keyboard.innerHTML = '';
    keys.forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'teclado-tecla';
        btn.textContent = key;
        btn.addEventListener('click', () => {
            document.querySelector('.input-respuesta').value += key;
        });
        keyboard.appendChild(btn);
    });

    // if there are no keys, remove inputmode none from input-respuesta
    const input = document.querySelector('.input-respuesta');
    if (keys.length === 0) {
        input.removeAttribute('inputmode');
        input.removeAttribute('readonly');
    } else {
        input.setAttribute('inputmode', 'none');
        input.setAttribute('readonly', 'true');
    }
}

function cargarBotonAudio() {
    const botonAudio = document.querySelector('.boton-audio');
    if (pregunta && pregunta.archivo_audio === '') {
        botonAudio.classList.add('boton-audio--esconder');
    } else {
        botonAudio.classList.remove('boton-audio--esconder');
    }
}

function deshabilitarBotones(estado){
    // make sure input-respuesta and submit-button are enabled
    const inputRespuesta = document.querySelector('.input-respuesta');
    const submitButton = document.querySelector('.submit-button');
    const botonAudio = document.querySelector('.boton-audio');
    const tecladoRespuestas = document.querySelectorAll('.teclado-tecla');
    tecladoRespuestas.forEach(button => {
        button.disabled = estado;
    });
    inputRespuesta.disabled = estado;
    submitButton.disabled = estado;
    botonAudio.disabled = estado;
    // tecladoRespuestas.disabled = estado;
    // console.log('Updated button states to disabled=', estado);
}


function proximaPregunta() {
    if (!pregunta) return;
    if (pregunta.id < cantidadPreguntas) {
        currentId = pregunta.id + 1;
        deshabilitarBotones(false);
        fetch(`../contenido/preguntas/tubh/1/${filename}.json`)
            .then(response => response.json())
            .then(data => {
                pregunta = data.preguntas.find(p => p.id === currentId);
                cargarBotonAudio();
                instrucciones.innerHTML = pregunta.instrucciones;
                actualizarListaDePreguntas();
                actualizarTeclado();
                audioActual = 0;
                playAudio();
            });
    } else {
        // Quiz completed
        const resultadoDiv = document.querySelector('.resultado-respuesta');
        
        resultadoDiv.textContent = 'Quiz completed!';
        resultadoDiv.className = 'resultado-respuesta completado';

        deshabilitarBotones(true);
        pregunta = null;
        actualizarListaDePreguntas();
    }
}

function limpiarString(input) {
    if (Array.isArray(input)) {
        // If input is an array, clean each string in the array
        return input.map(str => {
            str = String(str);
            str = str.trim().replace(/\s+/g, "");
            str = str.replace(/[.?!。？！，]/g, "");
            return str.toLowerCase();
        });
    } else {
        // If input is a string, clean the string
        input = String(input);
        input = input.trim().replace(/\s+/g, "");
        input = input.replace(/[.?!。？！，]/g, "");
        return input.toLowerCase();
    }
}

// on enter key press in input.respuesta, trigger submit button click
document.querySelector('.input-respuesta').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        document.querySelector('.submit-button').click();
    }
});

document.querySelector('.submit-button').addEventListener('click', () => {
    let userInput = document.querySelector('.input-respuesta').value;
    userInput = limpiarString(userInput);
    // console.log('User input: |', userInput, '|');
    if (pregunta) {
        // Find the state object for this pregunta
        const estado = preguntasEstado.find(p => p.id === pregunta.id);
        const resultadoDiv = document.querySelector('.resultado-respuesta');
        const respuestaCorrecta = limpiarString(pregunta.respuesta_correcta);
        // console.log('Correct answer(s):', respuestaCorrecta);
        // console.log('User input after cleaning and normalization:', userInput);
        if (Array.isArray(respuestaCorrecta)) {
            // console.log('Checking against multiple correct answers:', respuestaCorrecta);
            if (respuestaCorrecta.some(ans => ans === userInput)) {
                resultadoDiv.textContent = 'Correct!';
                resultadoDiv.className = 'resultado-respuesta correcto';
                if (estado) estado.value = 1;
                // console.log('Correct answer given, moving to next question.');
                proximaPregunta();
            } else {
                resultadoDiv.textContent = 'That was incorrect, please try again.';
                resultadoDiv.className = 'resultado-respuesta incorrecto';
                if (estado) estado.value = 0;
                // console.log('Incorrect answer, prompting user to try again.');
                playAudio();
            }
        } else {
            if (respuestaCorrecta === userInput) {
                resultadoDiv.textContent = 'Correct!';
                resultadoDiv.className = 'resultado-respuesta correcto';
                if (estado) estado.value = 1;
                // console.log('Correct answer given, moving to next question.');
                proximaPregunta();
            } else {
                resultadoDiv.textContent = 'That was incorrect, please try again.';
                resultadoDiv.className = 'resultado-respuesta incorrecto';
                if (estado) estado.value = 0;
                // console.log('Incorrect answer, prompting user to try again.');
                playAudio();
            }
        }
    }
    // console.log(preguntasEstado);
    document.querySelector('.input-respuesta').value = '';
});

let audioInstance = null;

function resetAudio() {
    if (audioInstance) {
        // console.log('Resetting audio, stopping current audio playback.');
        audioInstance.pause();
        audioInstance.currentTime = 0; // Reset playback position
    }
}

function playAudio() {
    if (pregunta && pregunta.archivo_audio) {
        resetAudio();
        // console.log('pregunta', pregunta);
        if (Array.isArray(pregunta.archivo_audio)) {
            // console.log('Playing audio from array:', pregunta.archivo_audio[audioActual]);
            audioInstance = new Audio(pregunta.archivo_audio[audioActual]);
            audioInstance.play();
            // audioInstance.addEventListener('ended', () => {
            audioActual = (audioActual + 1) % pregunta.archivo_audio.length;
            // });
        } else {
            // console.log('Playing audio:', pregunta.archivo_audio);
            audioInstance = new Audio(pregunta.archivo_audio);
            audioInstance.play();
        }
    }
}

document.querySelector('.boton-audio').addEventListener('click', () => {
    resetAudio();
    playAudio();
});

function resetProgress() {
    if (confirm('Are you sure you want to reset your progress for this quiz?')) {
        currentId = 1;
        localStorage.removeItem(`quiz_currentId_${filename}`);
        preguntasEstado = preguntasEstado.map(p => ({ id: p.id, value: 0 }));
        fetch(filePath)
            .then(response => response.json())
            .then(data => {
                pregunta = data.preguntas.find(p => p.id === currentId);
                if (!pregunta || !pregunta.input_chars_aceptados) return;

                instrucciones.innerHTML = pregunta.instrucciones;
                audioActual = 0;
                cargarBotonAudio();
                actualizarTeclado();
                const resultadoDiv = document.querySelector('.resultado-respuesta');
                resultadoDiv.textContent = '';
                resultadoDiv.className = 'resultado-respuesta';
                actualizarListaDePreguntas();
                deshabilitarBotones(false);
            });
    }
}

document.querySelector('.boton-reset').addEventListener('click', () => {
    resetProgress();
});

// as soon as i type in input.respuesta, clear resultado-respuesta text
document.querySelector('.input-respuesta').addEventListener('input', () => {
    const resultadoDiv = document.querySelector('.resultado-respuesta');
    resultadoDiv.textContent = '';
    resultadoDiv.className = 'resultado-respuesta';
});