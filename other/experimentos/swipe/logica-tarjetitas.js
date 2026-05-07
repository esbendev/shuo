const container = document.getElementById('cardContainer');
let currentIndex = 0;
let startY = 0;
let endY = 0;

let currentAudio = null;
let currentStatusIndicator = null;

function setViewportHeightVar() {
    document.documentElement.style.setProperty('--viewport-h', `${window.innerHeight}px`);
}

setViewportHeightVar();

function setAudioStatus(indicator, isPlaying, sourceLabel) {
    if (!indicator) {
        return;
    }

    const text = indicator.querySelector('.status-text');

    if (isPlaying) {
        indicator.classList.add('playing');
        text.textContent = `Playing (${sourceLabel})`;
        return;
    }

    indicator.classList.remove('playing');
    text.textContent = 'Stopped';
}

function playAudio(src, sourceLabel, indicator) {
    if (currentStatusIndicator && currentStatusIndicator !== indicator) {
        setAudioStatus(currentStatusIndicator, false);
    }

    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    currentAudio = new Audio(src);
    currentStatusIndicator = indicator;

    setAudioStatus(indicator, true, sourceLabel);

    currentAudio.addEventListener('ended', () => {
        setAudioStatus(indicator, false);
        if (currentAudio) {
            currentAudio = null;
        }
    });

    currentAudio.addEventListener('pause', () => {
        if (currentAudio && currentAudio.currentTime < currentAudio.duration) {
            setAudioStatus(indicator, false);
        }
    });

    currentAudio.play();
}

// por ahora hardcodeamos esto
// const filePath = "../../../contenido/preguntas/tubh/1/tubh1_rapidos.json";
const urlParams = new URLSearchParams(window.location.search);
const filename = urlParams.get('file') || 'tubh1_rapidos';

const filePath = filename.includes('tubh1_') 
    ? `../../../contenido/preguntas/tubh/1/${filename}.json` 
    : `../../../contenido/preguntas/tubh/2/${filename}.json`;
fetch(filePath)
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('cardContainer');
        const totalCards = data.preguntas.length;

        data.preguntas.forEach((pregunta, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.setProperty('--card-index', pregunta.id); // Use id from JSON

            const cardInner = document.createElement('div');
            cardInner.className = 'card-inner';

            const cardCounter = document.createElement('p');
            cardCounter.className = 'card-counter';
            cardCounter.textContent = `${index + 1} of ${totalCards}`;
            cardInner.appendChild(cardCounter);

            const contentStack = document.createElement('div');
            contentStack.className = 'content-stack';

            const chineseLabel = document.createElement('p');
            chineseLabel.className = 'text-slot-label';
            chineseLabel.textContent = 'Chinese';
            contentStack.appendChild(chineseLabel);

            const chineseSlot = document.createElement('div');
            chineseSlot.className = 'text-slot zh';

            const chineseText = document.createElement('p');
            chineseText.className = 'card-text zh';
            chineseText.textContent = pregunta.respuesta_correcta[0]; // Use the first respuesta_correcta
            chineseSlot.appendChild(chineseText);
            contentStack.appendChild(chineseSlot);

            const englishLabel = document.createElement('p');
            englishLabel.className = 'text-slot-label';
            englishLabel.textContent = 'English';
            contentStack.appendChild(englishLabel);

            const englishSlot = document.createElement('div');
            englishSlot.className = 'text-slot en';

            const englishText = document.createElement('p');
            englishText.className = 'card-text en';
            englishText.textContent = pregunta.texto_en_ingles || '';
            englishSlot.appendChild(englishText);
            contentStack.appendChild(englishSlot);

            cardInner.appendChild(contentStack);

            const showTextButton = document.createElement('button');
            showTextButton.className = 'button toggle-text-button';
            showTextButton.textContent = 'Show Chinese';
            showTextButton.addEventListener('click', () => {
                const isShown = chineseText.classList.toggle('revealed');
                showTextButton.textContent = isShown ? 'Hide Chinese' : 'Show Chinese';
            });

            const showEnglishButton = document.createElement('button');
            showEnglishButton.className = 'button toggle-text-button';
            showEnglishButton.textContent = 'Show English';
            const hasEnglishText = Boolean((pregunta.texto_en_ingles || '').trim());
            showEnglishButton.disabled = !hasEnglishText;
            showEnglishButton.addEventListener('click', () => {
                const isShown = englishText.classList.toggle('revealed');
                showEnglishButton.textContent = isShown ? 'Hide English' : 'Show English';
            });

            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'controls';

            const audioStatus = document.createElement('div');
            audioStatus.className = 'audio-status';

            const statusDot = document.createElement('span');
            statusDot.className = 'status-dot';
            audioStatus.appendChild(statusDot);

            const statusText = document.createElement('span');
            statusText.className = 'status-text';
            statusText.textContent = 'Stopped';
            audioStatus.appendChild(statusText);

            buttonContainer.appendChild(audioStatus);

            buttonContainer.appendChild(showTextButton);
            buttonContainer.appendChild(showEnglishButton);

            const buttonFast = document.createElement('button');
            buttonFast.className = 'button audio-button';
            buttonFast.id = 'audio-button-fast';
            buttonFast.textContent = 'Fast';
            buttonFast.addEventListener('click', () => {
                playAudio("../../" + pregunta.archivo_audio[0], 'Fast', audioStatus);
            });
            buttonContainer.appendChild(buttonFast);

            const buttonSlow = document.createElement('button');
            buttonSlow.className = 'button audio-button';
            buttonSlow.id = 'audio-button-slow';
            buttonSlow.textContent = 'Slow';
            buttonSlow.addEventListener('click', () => {
                playAudio("../../" + pregunta.archivo_audio[1], 'Slow', audioStatus);
            });
            buttonContainer.appendChild(buttonSlow);

            cardInner.appendChild(buttonContainer);
            card.appendChild(cardInner);
            container.appendChild(card);
        });
    })
    .catch(error => console.error('Error fetching JSON:', error));

function updateCardPosition() {
    const totalCards = container.children.length;
    currentIndex = Math.min(Math.max(currentIndex, 0), totalCards - 1);
    container.style.transform = `translateY(-${currentIndex * window.innerHeight}px)`;
}

function loadNewCard(currentIndex) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setAudioStatus(currentStatusIndicator, false);
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

function handleSwipe(event) {

    const direction = event.deltaY > 0 ? 1 : -1;

    currentIndex += direction;
    loadNewCard(currentIndex);

}

function preventScroll(event) {
    event.preventDefault();
}

function handleTouchStart(event) {
    startY = event.touches[0].clientY;
    this.touchStartTime = Date.now(); // Record the time when the touch starts
}

function handleTouchMove(event) {
    event.preventDefault();
    endY = event.touches[0].clientY;
}

function handleTouchEnd(event) {
    endY = event.changedTouches[0].clientY; // Use `changedTouches` for the end position
    const swipeThreshold = 30; // Minimum movement in pixels to qualify as a swipe
    const movement = Math.abs(startY - endY);
    const touchDuration = Date.now() - this.touchStartTime; // Calculate touch duration
    // console.log('Touch start time:', this.touchStartTime);
    // console.log('Swipe movement:', movement, 'Touch duration:', touchDuration);

    // Ignore taps (short duration and small movement)
    if (movement <= swipeThreshold || touchDuration < 10) {
        // console.log('Ignored as a tap');
        return;
    }

    // Process swipe
    const direction = startY - endY > 0 ? 1 : -1;
    currentIndex += direction;
    // console.log('Swipe direction:', direction);
    loadNewCard(currentIndex);
}

function handleKeyDown(event) {
    if (event.key === 'ArrowUp') {
        currentIndex -= 1;
    } else if (event.key === 'ArrowDown') {
        currentIndex += 1;
    }
    loadNewCard(currentIndex);
}

// Allow default scrolling behavior, but handle swipe gestures
container.addEventListener('touchstart', handleTouchStart, { passive: false });
container.addEventListener('touchmove', handleTouchMove, { passive: false });
container.addEventListener('touchend', handleTouchEnd, { passive: false });

window.addEventListener('wheel', handleSwipe, { passive: true });
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('resize', () => {
    setViewportHeightVar();
    updateCardPosition();
});
