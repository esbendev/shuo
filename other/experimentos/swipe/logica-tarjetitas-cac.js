const container = document.getElementById('cardContainer');
let currentIndex = 0;
let startY = 0;
let endY = 0;
let touchStartTime = 0;

let currentAudio = null;
let currentStatusIndicator = null;

function setViewportHeightVar() {
    document.documentElement.style.setProperty('--viewport-h', `${window.innerHeight}px`);
}

setViewportHeightVar();

function setAudioStatus(indicator, isPlaying, sourceLabel = 'Audio') {
    if (!indicator) {
        return;
    }

    const text = indicator.querySelector('.status-text');
    if (!text) {
        return;
    }

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

    currentAudio.play().catch(() => {
        setAudioStatus(indicator, false);
        console.warn('Audio playback was blocked until the user interacts with the page.');
    });
}

function formatAudioLabel(filename) {
    const withoutExtension = filename.replace(/\.[^/.]+$/, '');
    const normalized = withoutExtension
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return normalized || 'Audio';
}

function buildCard(audioUrl, index, total) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.setProperty('--card-index', String(index));

    const cardInner = document.createElement('div');
    cardInner.className = 'card-inner';

    const cardCounter = document.createElement('p');
    cardCounter.className = 'card-counter';
    cardCounter.textContent = `${index + 1} of ${total}`;
    cardInner.appendChild(cardCounter);

    const contentStack = document.createElement('div');
    contentStack.className = 'content-stack';

    const audioLabel = document.createElement('p');
    audioLabel.className = 'text-slot-label';
    audioLabel.textContent = 'Audio';
    contentStack.appendChild(audioLabel);

    const audioSlot = document.createElement('div');
    audioSlot.className = 'text-slot zh';

    const audioText = document.createElement('p');
    audioText.className = 'card-text zh revealed';
    audioText.textContent = formatAudioLabel(audioUrl.split('/').pop());
    audioSlot.appendChild(audioText);
    contentStack.appendChild(audioSlot);

    cardInner.appendChild(contentStack);

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

    const playButton = document.createElement('button');
    playButton.type = 'button';
    playButton.className = 'button audio-button';
    playButton.dataset.audioButton = 'true';
    playButton.textContent = 'Play audio';
    playButton.addEventListener('click', () => {
        playAudio(audioUrl, 'Audio', audioStatus);
    });
    buttonContainer.appendChild(playButton);

    // const replayButton = document.createElement('button');
    // replayButton.type = 'button';
    // replayButton.className = 'button toggle-text-button';
    // replayButton.textContent = 'Replay';
    // replayButton.addEventListener('click', () => {
    //     playAudio(audioUrl, 'Audio', audioStatus);
    // });
    // buttonContainer.appendChild(replayButton);

    cardInner.appendChild(buttonContainer);
    card.appendChild(cardInner);
    return card;
}

function sortAudioUrls(audioUrls) {
    return [...new Set(audioUrls)].sort((a, b) => {
        const getFileNumber = (url) => {
            const fileName = decodeURIComponent((url.split('/').pop() || '')).replace(/\.[^/.]+$/, '');
            const match = fileName.match(/(\d+)/);
            return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
        };

        const aNum = getFileNumber(a);
        const bNum = getFileNumber(b);

        if (aNum !== bNum) {
            return aNum - bNum;
        }

        return a.localeCompare(b);
    });
}

function buildCardsForDir(dirName) {
    const folderUrl = new URL(`../../../contenido/audio/cac/1/${dirName}/`, window.location.href).href;

    fetch(folderUrl)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Could not load folder:${response.status}`);
            }
            return response.text();
        })
        .then((htmlText) => {
            const doc = new DOMParser().parseFromString(htmlText, 'text/html');
            const audioUrls = Array.from(doc.querySelectorAll('a[href]'))
                .map((link) => link.getAttribute('href'))
                .filter((href) => href && /\.(mp3|wav|m4a|ogg)$/i.test(href))
                .map((href) => new URL(href, folderUrl).href);

            const sortedUrls = sortAudioUrls(audioUrls);

            if (!sortedUrls.length) {
                const fallbackText = document.createElement('div');
                fallbackText.className = 'card';
                fallbackText.style.setProperty('--card-index', '1');

                const inner = document.createElement('div');
                inner.className = 'card-inner intro';
                inner.textContent = 'No audio files found';
                fallbackText.appendChild(inner);
                container.appendChild(fallbackText);
                return;
            }

            sortedUrls.forEach((audioUrl, index) => {
                const card = buildCard(audioUrl, index + 1, sortedUrls.length);
                container.appendChild(card);
            });
        })
        .catch((error) => {
            console.error('Error loading CAC audio files:', error);

            const fallback = document.createElement('div');
            fallback.className = 'card';
            fallback.style.setProperty('--card-index', '1');

            const inner = document.createElement('div');
            inner.className = 'card-inner intro';
            inner.textContent = 'Could not load audio folder';
            fallback.appendChild(inner);
            container.appendChild(fallback);
        });
}

function updateCardPosition() {
    const totalCards = container.children.length;
    currentIndex = Math.min(Math.max(currentIndex, 0), totalCards - 1);
    container.style.transform = `translateY(-${currentIndex * window.innerHeight}px)`;
}

function loadNewCard(nextIndex) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setAudioStatus(currentStatusIndicator, false);
        currentAudio = null;
    }

    updateCardPosition();

    const newCard = container.children[nextIndex];
    if (!newCard) {
        return;
    }

    if (nextIndex === 0) {
        return;
    }

    const audioButton = newCard.querySelector('[data-audio-button="true"]');
    if (audioButton) {
        audioButton.click();
    }
}

function handleSwipe(event) {
    if (!event || typeof event.deltaY === 'undefined') {
        return;
    }

    const direction = event.deltaY > 0 ? 1 : -1;
    currentIndex += direction;
    loadNewCard(currentIndex);
}

function preventScroll(event) {
    event.preventDefault();
}

function handleTouchStart(event) {
    startY = event.touches[0].clientY;
    touchStartTime = Date.now();
}

function handleTouchMove(event) {
    event.preventDefault();
    endY = event.touches[0].clientY;
}

function handleTouchEnd(event) {
    const end = event.changedTouches[0];
    endY = end.clientY;

    const swipeThreshold = 30;
    const movement = Math.abs(startY - endY);
    const touchDuration = Date.now() - touchStartTime;

    if (movement <= swipeThreshold || touchDuration < 10) {
        return;
    }

    const direction = startY - endY > 0 ? 1 : -1;
    currentIndex += direction;
    loadNewCard(currentIndex);
}

function handleKeyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        currentIndex += 1;
        loadNewCard(currentIndex);
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        currentIndex -= 1;
        loadNewCard(currentIndex);
    }
}

function init() {
    const params = new URLSearchParams(window.location.search);
    const dir = params.get('dir') || 'week-1a';
    buildCardsForDir(dir);

    window.addEventListener('resize', setViewportHeightVar);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    const gamepadMapping = {
        0: 'ArrowUp',
        1: 'ArrowRight',
        2: 'ArrowLeft',
        3: 'ArrowDown',
    };

    let controllerIndex = null;
    let prevStates = [];
    let pollInterval = null;

    window.addEventListener('gamepadconnected', (event) => {
        controllerIndex = event.gamepad.index;
        prevStates = new Array(event.gamepad.buttons.length).fill(false);

        if (!pollInterval) {
            pollInterval = setInterval(() => {
                if (controllerIndex === null) {
                    return;
                }

                const gp = navigator.getGamepads()[controllerIndex];
                if (!gp) {
                    return;
                }

                gp.buttons.forEach((button, index) => {
                    const isPressed = button.pressed;
                    const wasPressed = prevStates[index];
                    const targetKey = gamepadMapping[index];

                    if (isPressed && !wasPressed && targetKey) {
                        const keyEvent = new KeyboardEvent('keydown', {
                            key: targetKey,
                            code: targetKey,
                            bubbles: true,
                            cancelable: true,
                        });
                        window.dispatchEvent(keyEvent);
                    }

                    prevStates[index] = isPressed;
                });
            }, 1000 / 60);
        }
    });

    window.addEventListener('gamepaddisconnected', () => {
        controllerIndex = null;
        clearInterval(pollInterval);
        pollInterval = null;
    });
}

init();
