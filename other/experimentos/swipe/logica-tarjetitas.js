const container = document.getElementById('cardContainer');
let currentIndex = 0;
let startY = 0;
let endY = 0;

let currentAudio = null;

function playAudio(src) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    currentAudio = new Audio(src);
    currentAudio.play();
}
// por ahora hardcodeamos esto
const filePath = "../../../contenido/preguntas/tubh/1/tubh1_rapidos.json";
fetch(filePath)
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('cardContainer');
        data.preguntas.forEach((pregunta) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.setProperty('--card-index', pregunta.id); // Use id from JSON
            card.style.backgroundColor = pregunta.id % 2 === 0 ? 'lightyellow' : 'lightgray';

            const text = document.createElement('div');
            text.className = 'card-text';
            text.style.display = 'none'; // Initially hidden
            text.textContent = pregunta.respuesta_correcta[0]; // Use the first respuesta_correcta
            card.appendChild(text);

            const showTextButton = document.createElement('button');
            showTextButton.className = 'toggle-text-button';
            showTextButton.textContent = 'Show Text';
            showTextButton.addEventListener('click', () => {
                text.style.display = text.style.display === 'none' ? 'block' : 'none';
            });
            card.appendChild(showTextButton);

            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'button-container';
            card.appendChild(buttonContainer);

            const buttonFast = document.createElement('button');
            buttonFast.className = 'audio-button';
            buttonFast.id = 'audio-button-fast';
            buttonFast.textContent = 'Fast';
            buttonFast.addEventListener('click', () => {
                playAudio("../../" + pregunta.archivo_audio[0]);
            });
            buttonContainer.appendChild(buttonFast);

            const buttonSlow = document.createElement('button');
            buttonSlow.className = 'audio-button';
            buttonSlow.id = 'audio-button-slow';
            buttonSlow.textContent = 'Slow';
            buttonSlow.addEventListener('click', () => {
                playAudio("../../" + pregunta.archivo_audio[1]);
            });
            buttonContainer.appendChild(buttonSlow);

            container.appendChild(card);
        });
    })
    .catch(error => console.error('Error fetching JSON:', error));

function updateCardPosition() {
    const totalCards = container.children.length;
    currentIndex = Math.min(Math.max(currentIndex, 0), totalCards - 1);
    container.style.transform = `translateY(-${currentIndex * 100}vh)`;
}

function handleSwipe(event) {

    const direction = event.deltaY > 0 ? 1 : -1;

    currentIndex += direction;

    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }

    updateCardPosition();

    const newCard = container.children[currentIndex];

    if (newCard) {
        const fastAudioButton = newCard.querySelector('#audio-button-fast');
        if (fastAudioButton) {
            fastAudioButton.click();
        } else {
            console.log('fastAudioButton not found');
        }
    } else {
        console.log('newCard not found');
    }
}

function handleTouchStart(event) {
    startY = event.touches[0].clientY;
}

function handleTouchMove(event) {
    endY = event.touches[0].clientY;
}

function handleTouchEnd() {
    const direction = startY - endY > 0 ? 1 : -1;
    currentIndex += direction;
    updateCardPosition();
}

function handleKeyDown(event) {
    if (event.key === 'ArrowUp') {
        currentIndex -= 1;
    } else if (event.key === 'ArrowDown') {
        currentIndex += 1;
    }
    updateCardPosition();
}

window.addEventListener('wheel', handleSwipe, { passive: true });
container.addEventListener('touchstart', handleTouchStart, { passive: true });
container.addEventListener('touchmove', handleTouchMove, { passive: true });
container.addEventListener('touchend', handleTouchEnd, { passive: true });
window.addEventListener('keydown', handleKeyDown);