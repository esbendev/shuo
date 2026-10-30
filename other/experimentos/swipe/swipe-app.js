(function (globalScope) {
  const container = document.getElementById('cardContainer');
  let currentIndex = 0;
  let startY = 0;
  let endY = 0;
  let touchStartTime = 0;
  let currentAudio = null;
  let currentStatusIndicator = null;
  let deckCards = [];
  let deckOptions = {};
  let deckStarted = false;

  function setViewportHeightVar() {
    document.documentElement.style.setProperty('--viewport-h', `${window.innerHeight}px`);
  }

  function setAudioStatus(indicator, isPlaying, sourceLabel) {
    if (!indicator) {
      return;
    }

    const text = indicator.querySelector('.status-text');
    if (!text) {
      return;
    }

    if (isPlaying) {
      indicator.classList.add('playing');
      text.textContent = `Playing (${sourceLabel || 'Audio'})`;
      return;
    }

    indicator.classList.remove('playing');
    text.textContent = 'Stopped';
  }

  function playAudio(src, sourceLabel, indicator) {
    if (!src) {
      return;
    }

    if (currentStatusIndicator && currentStatusIndicator !== indicator) {
      setAudioStatus(currentStatusIndicator, false);
    }

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    const absoluteSrc = globalScope.SwipeCore.resolveMediaUrl(src);
    currentAudio = new Audio(absoluteSrc);
    currentStatusIndicator = indicator;

    setAudioStatus(indicator, true, sourceLabel || 'Audio');

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

  function updateCardPosition() {
    if (!container) {
      return;
    }

    const totalCards = container.children.length;
    if (!totalCards) {
      return;
    }

    currentIndex = Math.min(Math.max(currentIndex, 0), totalCards - 1);
    container.style.transform = `translateY(-${currentIndex * window.innerHeight}px)`;
  }

  function getPrimaryAudioButton(card) {
    return card?.querySelector('#audio-button-primary') || card?.querySelector('#audio-button-fast');
  }

  function loadNewCard(nextIndex) {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setAudioStatus(currentStatusIndicator, false);
      currentAudio = null;
    }

    const totalCards = container ? container.children.length : 0;
    if (!totalCards) {
      return;
    }

    currentIndex = Math.min(Math.max(nextIndex, 0), totalCards - 1);
    updateCardPosition();

    const newCard = container.children[currentIndex];
    if (newCard) {
      const primaryAudioButton = getPrimaryAudioButton(newCard);
      if (primaryAudioButton) {
        primaryAudioButton.click();
      }
    }
  }

  function handleSwipe(event) {
    const direction = event.deltaY > 0 ? 1 : -1;
    currentIndex += direction;
    loadNewCard(currentIndex);
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
    endY = event.changedTouches[0].clientY;
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
    const currentCard = container ? container.children[currentIndex] : null;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const choice = currentCard?.querySelector('#audio-button-primary') || currentCard?.querySelector('#audio-button-fast') || currentCard?.querySelector('#audio-button-slow');
      if (choice) {
        choice.click();
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      currentIndex -= 1;
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      currentIndex += 1;
    } else {
      return;
    }

    loadNewCard(currentIndex);
  }

  function makeCardFromPregunta(pregunta, index, total, options = {}) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.setProperty('--card-index', index);

    const cardInner = document.createElement('div');
    cardInner.className = 'card-inner';

    const cardCounter = document.createElement('p');
    cardCounter.className = 'card-counter';
    cardCounter.textContent = `${index + 1} of ${total}`;
    cardInner.appendChild(cardCounter);

    if (options.showTopic && (pregunta.topic || options.topicLabel)) {
      const topic = document.createElement('p');
      topic.className = 'topic';
      topic.textContent = pregunta.topic || options.topicLabel || 'Daily News';
      cardInner.appendChild(topic);
    }

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

    globalScope.SwipeCore.applyAudioButtons({
      rawAudio: pregunta.archivo_audio,
      buttonContainer,
      audioStatus,
      playAudio: (source, label, indicator) => playAudio(source, label, indicator),
    });

    cardInner.appendChild(buttonContainer);
    card.appendChild(cardInner);
    return card;
  }

  async function resolveClassicFilePath() {
    const urlParams = new URLSearchParams(window.location.search);
    const requestedFile = urlParams.get('file') || 'week-1a';
    const requestedDir = (urlParams.get('dir') || urlParams.get('folder') || '').replace(/^\/+|\/+$/g, '');
    const normalizedFilename = requestedFile.replace(/\.json$/i, '');

    const tubhMatch = normalizedFilename.match(/^tubh([12])_/i);
    if (tubhMatch) {
      const candidate = globalScope.SwipeCore.buildProjectRootUrl('contenido', 'preguntas', 'tubh', tubhMatch[1], `${normalizedFilename}.json`);
      try {
        const response = await fetch(candidate);
        if (response.ok) return candidate;
      } catch (error) {
        // continue
      }
      return candidate;
    }

    const directoryCandidates = [];

    const normalizeDirectory = (value) => {
      if (!value) return '';
      const cleaned = value.replace(/^\/+|\/+$/g, '').replace(/^.*?contenido\/preguntas\//, '').replace(/^\/+/, '');
      if (!cleaned) return '';
      if (/^cac\//i.test(cleaned)) return cleaned;
      if (/^[12]$/i.test(cleaned)) return `cac/${cleaned}`;
      return `cac/${cleaned.replace(/^cac\//i, '')}`;
    };

    const requestedDirectory = normalizeDirectory(requestedDir);
    if (requestedDirectory) {
      directoryCandidates.push(requestedDirectory);
    } else {
      directoryCandidates.push('cac/1', 'cac/2');
    }

    const fileName = `${normalizedFilename}.json`;
    const filePathCandidates = [];

    for (const directory of directoryCandidates) {
      filePathCandidates.push(globalScope.SwipeCore.buildProjectRootUrl('contenido', 'preguntas', directory, fileName));
    }

    for (const candidate of filePathCandidates) {
      try {
        const response = await fetch(candidate);
        if (response.ok) return candidate;
      } catch (error) {
        // continue
      }
    }

    return globalScope.SwipeCore.buildProjectRootUrl('contenido', 'preguntas', 'cac', '1', fileName);
  }

  async function loadClassicDeck() {
    const filePath = await resolveClassicFilePath();
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load questions from ${filePath}`);
    }
    return response.json();
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  async function gatherFilesFromManifests() {
    const manifests = [
      globalScope.SwipeCore.buildProjectRootUrl('contenido', 'preguntas', 'tubh', '1', 'lista_dias.json'),
      globalScope.SwipeCore.buildProjectRootUrl('contenido', 'preguntas', 'tubh', '2', 'lista_dias.json')
    ];

    const ids = [];
    await Promise.all(manifests.map(async (path) => {
      try {
        const res = await fetch(path);
        if (!res.ok) return;
        const list = await res.json();
        list.forEach((day) => {
          (day.content || []).forEach((item) => {
            if (item.disabled) return;
            if (!item.id) return;
            if (String(item.id).includes('_swipe')) return;
            ids.push(item.id);
          });
        });
      } catch (error) {
        console.warn('Failed to fetch manifest', path, error);
      }
    }));

    return Array.from(new Set(ids));
  }

  const CAC_FILE_PATHS = [
    globalScope.SwipeCore.buildProjectRootUrl('contenido', 'preguntas', 'cac', '1', 'lesson-5a.json'),
    globalScope.SwipeCore.buildProjectRootUrl('contenido', 'preguntas', 'cac', '1', 'week-1a.json'),
    globalScope.SwipeCore.buildProjectRootUrl('contenido', 'preguntas', 'cac', '1', 'week-2a.json'),
    globalScope.SwipeCore.buildProjectRootUrl('contenido', 'preguntas', 'cac', '1', 'week-3a.json'),
    globalScope.SwipeCore.buildProjectRootUrl('contenido', 'preguntas', 'cac', '2', 'lesson-6a.json')
  ];

  async function buildRandomPool(amount) {
    const ids = await gatherFilesFromManifests();
    const tubhFilePaths = ids.map((id) => {
      if (String(id).startsWith('tubh1_')) return globalScope.SwipeCore.buildProjectRootUrl('contenido', 'preguntas', 'tubh', '1', `${id}.json`);
      if (String(id).startsWith('tubh2_')) return globalScope.SwipeCore.buildProjectRootUrl('contenido', 'preguntas', 'tubh', '2', `${id}.json`);
      return null;
    }).filter(Boolean).filter((path) => path.endsWith('_rapidos.json'));

    const filePaths = [...tubhFilePaths, ...CAC_FILE_PATHS];

    if (!filePaths.length) return [];

    shuffle(filePaths);
    const target = Math.max(0, Math.floor(amount) || 0);
    const pickCount = Math.min(target > 0 ? target : filePaths.length, filePaths.length);
    const selectedPreguntas = [];
    const attemptedFiles = new Set();

    for (let i = 0; i < filePaths.length && selectedPreguntas.length < pickCount; i++) {
      const filePath = filePaths[i];
      if (attemptedFiles.has(filePath)) continue;
      attemptedFiles.add(filePath);

      try {
        const res = await fetch(filePath);
        if (!res.ok) continue;
        const json = await res.json();
        if (!json || !Array.isArray(json.preguntas) || json.preguntas.length === 0) continue;
        const pidx = Math.floor(Math.random() * json.preguntas.length);
        selectedPreguntas.push(json.preguntas[pidx]);
      } catch (error) {
        // ignore and continue
      }
    }

    return selectedPreguntas;
  }

  async function resolveDailyDeckPath() {
    const urlParams = new URLSearchParams(window.location.search);
    const requestedFile = urlParams.get('file') || 'daily-news-20261019';
    const requestedDir = (urlParams.get('dir') || urlParams.get('folder') || 'daily-news').replace(/^\/+|\/+$/g, '');
    const normalizedFilename = requestedFile.replace(/\.json$/i, '');
    const candidates = [
      `./${requestedDir}/${normalizedFilename}.json`,
      `./${requestedDir}/${requestedFile}.json`,
      `./${normalizedFilename}.json`,
      `./${requestedFile}.json`
    ];

    for (const candidate of candidates) {
      try {
        const response = await fetch(candidate);
        if (response.ok) return candidate;
      } catch (error) {
        // continue
      }
    }

    return `./${requestedDir}/${normalizedFilename}.json`;
  }

  function createIntroCard() {
    const introCard = document.createElement('div');
    introCard.className = 'card';
    introCard.style.setProperty('--card-index', 0);

    const introInner = document.createElement('div');
    introInner.className = 'card-inner intro';
    introInner.innerHTML = '<div>Swipe to start</div><div class="cafe"><p>Made with ☕ by <a href="https://esbendev.com/index-en.html">@esbendev</a></p><p>Wanna support me? <a href="https://ko-fi.com/esbendev">buy me a coffee!</a> :)</p></div>';

    introCard.appendChild(introInner);
    return introCard;
  }

  function renderCards(cards, options = {}) {
    if (!container) {
      return;
    }

    const introCard = container.querySelector('.card .intro')?.closest('.card') || createIntroCard();
    container.innerHTML = '';
    container.appendChild(introCard);

    cards.forEach((pregunta, index) => {
      const renderedIndex = globalScope.SwipeCore.getCardRenderIndex(index, { includeIntroCard: true });
      const card = makeCardFromPregunta(pregunta, index, cards.length, options);
      card.style.setProperty('--card-index', renderedIndex);
      container.appendChild(card);
    });

    currentIndex = 0;
    updateCardPosition();
  }

  async function initialize() {
    setViewportHeightVar();
    const mode = getDeckMode();

    try {
      if (mode === 'random') {
        const amount = parseInt(new URLSearchParams(window.location.search).get('amount'), 10);
        const selected = await buildRandomPool(amount);
        if (!selected.length) {
          renderCards([{ respuesta_correcta: ['No random cards found.'], texto_en_ingles: '', archivo_audio: '' }], { showTopic: false });
          return;
        }
        renderCards(selected, { showTopic: false });
      } else if (mode === 'daily-news') {
        const deckPath = await resolveDailyDeckPath();
        const response = await fetch(deckPath);
        if (!response.ok) throw new Error(`Failed to load deck: ${response.status}`);
        const data = await response.json();
        renderCards(data.preguntas || [], { showTopic: true, topicLabel: 'Daily News' });
      } else {
        const data = await loadClassicDeck();
        renderCards(data.preguntas || [], { showTopic: false });
      }
    } catch (error) {
      console.error(error);
      if (container) {
        const introCard = container.querySelector('.card .intro')?.closest('.card') || createIntroCard();
        container.innerHTML = '';
        container.appendChild(introCard);
      }
    }
  }

  function getDeckMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const requestedFile = (urlParams.get('file') || '').toLowerCase();
    const requestedDir = (urlParams.get('dir') || urlParams.get('folder') || '').toLowerCase();
    const explicitMode = (urlParams.get('mode') || '').toLowerCase();

    if (document.body.dataset.deckMode) {
      return document.body.dataset.deckMode;
    }

    if (['random', 'cac', 'daily-news', 'classic'].includes(explicitMode)) {
      return explicitMode;
    }

    if (urlParams.has('amount')) {
      return 'random';
    }

    if (requestedDir.includes('daily') || requestedFile.includes('daily-news') || window.location.pathname.includes('daily-news')) {
      return 'daily-news';
    }

    if (/^tubh[12]_/.test(requestedFile)) {
      return 'classic';
    }

    if (requestedDir.includes('cac') || requestedFile.includes('week-') || requestedFile.includes('lesson-') || requestedDir === '1' || requestedDir === '2') {
      return 'cac';
    }

    return 'classic';
  }

  function bindGlobalInteractions() {
    if (!container) {
      return;
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    window.addEventListener('wheel', handleSwipe, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', () => {
      setViewportHeightVar();
      updateCardPosition();
    });
  }

  bindGlobalInteractions();
  initialize();

  globalScope.SwipeDeckApp = {
    initialize,
    getDeckMode,
    playAudio,
    renderCards,
    setAudioStatus,
  };
})(window);
