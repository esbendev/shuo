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

// If the URL provides a `file` param we keep the old behavior. If it provides
// `amount=x` (and no file) we'll build a randomized pool from all available
// files listed in the `lista_dias.json` manifests and pick `x` random questions.
const urlParams = new URLSearchParams(window.location.search);
const amountParam = parseInt(urlParams.get('amount'), 10);

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function makeCardFromPregunta(pregunta, index, total) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.setProperty('--card-index', index);

    const cardInner = document.createElement('div');
    cardInner.className = 'card-inner';

    const cardCounter = document.createElement('p');
    cardCounter.className = 'card-counter';
    cardCounter.textContent = `${index + 1} of ${total}`;
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
    chineseText.textContent = pregunta.respuesta_correcta && pregunta.respuesta_correcta[0] ? pregunta.respuesta_correcta[0] : '';
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
        if (pregunta.archivo_audio && pregunta.archivo_audio[0]) {
            playAudio("../../" + pregunta.archivo_audio[0], 'Fast', audioStatus);
        }
    });
    buttonContainer.appendChild(buttonFast);

    const buttonSlow = document.createElement('button');
    buttonSlow.className = 'button audio-button';
    buttonSlow.id = 'audio-button-slow';
    buttonSlow.textContent = 'Slow';
    buttonSlow.addEventListener('click', () => {
        if (pregunta.archivo_audio && pregunta.archivo_audio[1]) {
            playAudio("../../" + pregunta.archivo_audio[1], 'Slow', audioStatus);
        }
    });
    buttonContainer.appendChild(buttonSlow);

    cardInner.appendChild(buttonContainer);
    card.appendChild(cardInner);
    return card;
}

async function gatherFilesFromManifests() {
    const manifests = [
        '../../../contenido/preguntas/tubh/1/lista_dias.json',
        '../../../contenido/preguntas/tubh/2/lista_dias.json'
    ];

    const ids = [];
    await Promise.all(manifests.map(async (path) => {
        try {
            const res = await fetch(path);
            if (!res.ok) return;
            const list = await res.json();
            list.forEach(day => {
                (day.content || []).forEach(item => {
                    if (item.disabled) return;
                    // ignore 'swipe' links or items without an id
                    if (!item.id) return;
                    // skip swipe entries (those that point back to this experiment)
                    if (String(item.id).includes('_swipe')) return;
                    ids.push(item.id);
                });
            });
        } catch (e) {
            console.warn('Failed to fetch manifest', path, e);
        }
    }));
    // dedupe
    return Array.from(new Set(ids));
}

async function buildRandomPool(amount) {
    const ids = await gatherFilesFromManifests();
    const filePaths = ids.map(id => {
        if (String(id).startsWith('tubh1_')) return `../../../contenido/preguntas/tubh/1/${id}.json`;
        if (String(id).startsWith('tubh2_')) return `../../../contenido/preguntas/tubh/2/${id}.json`;
        return null;
    }).filter(Boolean)
      .filter(path => path.endsWith('_rapidos.json'));
    // Ensure we pick from distinct files: choose up to `amount` different files,
    // then pick one random question from each selected file.
    if (filePaths.length === 0) return [];

    shuffle(filePaths);
    const target = Math.max(0, Math.floor(amount) || 0);
    const maxFiles = filePaths.length;
    const pickCount = Math.min(target > 0 ? target : maxFiles, maxFiles);

    const selectedPreguntas = [];
    for (let i = 0; i < filePaths.length && selectedPreguntas.length < pickCount; i++) {
        try {
            const res = await fetch(filePaths[i]);
            if (!res.ok) continue;
            const json = await res.json();
            if (!json || !Array.isArray(json.preguntas) || json.preguntas.length === 0) continue;
            const pidx = Math.floor(Math.random() * json.preguntas.length);
            selectedPreguntas.push(json.preguntas[pidx]);
        } catch (e) {
            // ignore and continue
        }
    }
    console.log('Selected preguntas:', selectedPreguntas);
    return selectedPreguntas;
}

async function init() {
    const containerEl = document.getElementById('cardContainer');
    const selected = await buildRandomPool(amountParam);
    const hasIntro = Boolean(containerEl.querySelector('.card-inner.intro'));

    if (!selected || selected.length === 0) {
        if (hasIntro) return; // keep the existing intro card
        const card = document.createElement('div');
        card.className = 'card';
        card.style.setProperty('--card-index', 0);
        const cardInner = document.createElement('div');
        cardInner.className = 'card-inner intro';
        cardInner.textContent = 'No random cards found.';
        card.appendChild(cardInner);
        containerEl.appendChild(card);
        return;
    }

    const total = selected.length;
    const indexOffset = hasIntro ? 1 : 0;
    selected.forEach((pregunta, index) => {
        const card = makeCardFromPregunta(pregunta, index, total);
        // offset the CSS position so the existing intro (if any) remains at index 0
        card.style.setProperty('--card-index', index + indexOffset);
        containerEl.appendChild(card);
    });
}

init();

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
