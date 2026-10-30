(function (globalScope) {
  function resolveMediaUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return '';
    }

    const trimmed = rawUrl.trim();
    if (!trimmed) {
      return '';
    }

    if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('blob:') || trimmed.startsWith('data:') || trimmed.startsWith('file:')) {
      return trimmed;
    }

    const origin = globalScope.location && globalScope.location.origin ? globalScope.location.origin : 'http://localhost';

    if (trimmed.startsWith('/')) {
      const siteRelativePath = trimmed.replace(/^\/shuo(?=\/)/i, '');
      return `${origin}${siteRelativePath}`;
    }

    const normalizedProjectRelative = trimmed.replace(/^(?:\.\/|\.\.\/)+/, '');
    if (normalizedProjectRelative.startsWith('contenido/') || normalizedProjectRelative.startsWith('other/experimentos/') || normalizedProjectRelative.startsWith('shuo/')) {
      const sitePath = normalizedProjectRelative.replace(/^shuo\//i, '');
      return `${origin}/${sitePath}`;
    }

    if (/^(?:\.\.?\/|\w+[\/\\]|[^:]+\.[^/\\]+|[^:]+$)/.test(trimmed)) {
      const baseHref = globalScope.location && globalScope.location.href ? globalScope.location.href : 'http://localhost/';
      return new URL(trimmed, baseHref).href;
    }

    return trimmed;
  }

  function buildProjectRootUrl(...segments) {
    const origin = globalScope.location && globalScope.location.origin ? globalScope.location.origin : 'http://localhost';
    const cleaned = segments
      .filter((segment) => segment !== undefined && segment !== null && segment !== '')
      .flatMap((segment) => String(segment).split('/'))
      .map((segment) => segment.trim())
      .filter(Boolean)
      .filter((segment) => segment !== '.');

    if (!cleaned.length) {
      return origin;
    }

    const path = `/${cleaned.join('/')}`;
    return `${origin}${path}`;
  }

  function normalizeAudioSources(rawAudio) {
    if (!rawAudio) {
      return [];
    }

    const rawItems = [];

    if (Array.isArray(rawAudio)) {
      rawItems.push(...rawAudio);
    } else if (typeof rawAudio === 'object') {
      Object.keys(rawAudio).forEach((key) => {
        if (rawAudio[key]) {
          rawItems.push(rawAudio[key]);
        }
      });
    } else {
      rawItems.push(rawAudio);
    }

    const uniqueSources = [];
    const seen = new Set();

    rawItems.forEach((item) => {
      if (typeof item !== 'string') {
        return;
      }

      const candidate = item.trim();
      if (!candidate) {
        return;
      }

      const resolved = resolveMediaUrl(candidate);
      if (!resolved || seen.has(resolved)) {
        return;
      }

      seen.add(resolved);
      uniqueSources.push(resolved);
    });

    return uniqueSources;
  }

  function buildAudioButtonConfig(rawAudio) {
    const sources = normalizeAudioSources(rawAudio);

    if (!sources.length) {
      return [];
    }

    if (sources.length === 1) {
      return [{ key: 'primary', label: 'Play', source: sources[0] }];
    }

    return sources.slice(0, 2).map((source, index) => ({
      key: index === 0 ? 'fast' : 'slow',
      label: index === 0 ? 'Fast' : 'Slow',
      source,
    }));
  }

  function applyAudioButtons({ rawAudio, buttonContainer, audioStatus, playAudio }) {
    const buttonConfig = buildAudioButtonConfig(rawAudio);

    buttonConfig.forEach(({ key, label, source }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'button audio-button';
      button.id = buttonConfig.length === 1 ? 'audio-button-primary' : `audio-button-${key}`;
      button.textContent = label;
      button.addEventListener('click', () => {
        if (playAudio) {
          playAudio(source, label, audioStatus);
        }
      });
      buttonContainer.appendChild(button);
    });

    return buttonConfig;
  }

  function getCardRenderIndex(index, { includeIntroCard = true } = {}) {
    if (typeof index !== 'number' || Number.isNaN(index)) {
      return 0;
    }

    return includeIntroCard ? index + 1 : index;
  }

  const api = {
    buildProjectRootUrl,
    resolveMediaUrl,
    normalizeAudioSources,
    buildAudioButtonConfig,
    applyAudioButtons,
    getCardRenderIndex,
  };

  globalScope.SwipeCore = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
