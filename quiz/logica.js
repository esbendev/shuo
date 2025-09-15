let pregunta; // Declare pregunta in the outer scope
let cantidadPreguntas = 0;
let preguntasEstado = [];
let currentId = 1;

// get filename from URL params
const urlParams = new URLSearchParams(window.location.search);
const filename = urlParams.get('file') || '';
const tituloQuiz = document.querySelector('.titulo-quiz');
const instrucciones = document.querySelector('.instrucciones');

if (filename == '') {
    // redirect to ../index.html if no file param
    window.location.href = '../index.html';``
}

// Check localStorage for existing currentId for this filename
const storageKey = `quiz_currentId_${filename}`;
const storedId = localStorage.getItem(storageKey);
if (storedId) {
    currentId = parseInt(storedId, 10);
}

// cargo archivo con audio, respuesta correcta y teclado
fetch(`../contenido/preguntas/${filename}.json`)
.then(response => response.json())
.then(data => {
    preguntasEstado = data.preguntas.map(p => ({
        id: p.id,
        value: p.id < currentId ? 1 : 0
    }));

    pregunta = data.preguntas.find(p => p.id === currentId);
    if (!pregunta || !pregunta.input_chars_aceptados) return;

    tituloQuiz.textContent = data.titulo;

    instrucciones.textContent = pregunta.instrucciones;
    
    cargarBotonAudio();

    actualizarTeclado();

    cantidadPreguntas = data.preguntas.length;

    // save cantidadPreguntas to localStorage for this filename
    localStorage.setItem(`quiz_cantidadPreguntas_${filename}`, cantidadPreguntas);
    actualizarListaDePreguntas();
});

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


function proximaPregunta() {
    if (!pregunta) return;
    if (pregunta.id < cantidadPreguntas) {
        currentId = pregunta.id + 1;

        fetch(`../contenido/preguntas/${filename}.json`)
        .then(response => response.json())
        .then(data => {
            pregunta = data.preguntas.find(p => p.id === currentId);
            cargarBotonAudio();
            instrucciones.textContent = pregunta.instrucciones;
            actualizarListaDePreguntas();
            actualizarTeclado();
            playAudio();
        });
    } else {
        // Quiz completed
        const resultadoDiv = document.querySelector('.resultado-respuesta');
        resultadoDiv.textContent = 'Quiz completed!';
        resultadoDiv.className = 'resultado-respuesta completado';
        pregunta = null;
        actualizarListaDePreguntas();
    }
}

// on enter key press in input.respuesta, trigger submit button click
document.querySelector('.input-respuesta').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        document.querySelector('.submit-button').click();
    }
});

document.querySelector('.submit-button').addEventListener('click', () => {
    const userInput = document.querySelector('.input-respuesta').value;
    if (pregunta) {
        // Find the state object for this pregunta
        const estado = preguntasEstado.find(p => p.id === pregunta.id);
        const resultadoDiv = document.querySelector('.resultado-respuesta');
        if (userInput === pregunta.respuesta_correcta) {
            resultadoDiv.textContent = 'Correct!';
            resultadoDiv.className = 'resultado-respuesta correcto';
            if (estado) estado.value = 1;
            proximaPregunta();
        } else {
            resultadoDiv.textContent = 'That was incorrect, please try again.';
            resultadoDiv.className = 'resultado-respuesta incorrecto';
            if (estado) estado.value = 0;
            playAudio();
        }
    }
    console.log(preguntasEstado);
    document.querySelector('.input-respuesta').value = '';
});

function playAudio() {
    if (pregunta && pregunta.archivo_audio) {
        console.log('pregunta', pregunta);
        console.log('Playing audio:', pregunta.archivo_audio);
        const audio = new Audio(pregunta.archivo_audio);
        audio.play();
    }
}

document.querySelector('.boton-audio').addEventListener('click', () => {
    playAudio();
});