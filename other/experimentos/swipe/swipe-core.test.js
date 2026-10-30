const test = require('node:test');
const assert = require('node:assert/strict');

const SwipeCore = require('./swipe-core.js');

test('normalizeAudioSources handles single string, arrays, and empty values', () => {
  assert.deepEqual(
    SwipeCore.normalizeAudioSources('/shuo/audio/legacy-single.mp3'),
    ['http://localhost/audio/legacy-single.mp3']
  );

  assert.deepEqual(
    SwipeCore.normalizeAudioSources(['', './audio/legacy-fast.mp3', './audio/legacy-fast.mp3', './audio/legacy-slow.mp3']),
    [
      'http://localhost/audio/legacy-fast.mp3',
      'http://localhost/audio/legacy-slow.mp3',
    ]
  );

  assert.deepEqual(SwipeCore.normalizeAudioSources(null), []);
});

test('buildAudioButtonConfig supports legacy and modern payload shapes', () => {
  assert.deepEqual(SwipeCore.buildAudioButtonConfig('./audio/modern.mp3'), [
    { key: 'primary', label: 'Play', source: 'http://localhost/audio/modern.mp3' },
  ]);

  assert.deepEqual(SwipeCore.buildAudioButtonConfig({ fast: './audio/fast.mp3', slow: './audio/slow.mp3' }), [
    { key: 'fast', label: 'Fast', source: 'http://localhost/audio/fast.mp3' },
    { key: 'slow', label: 'Slow', source: 'http://localhost/audio/slow.mp3' },
  ]);

  assert.deepEqual(SwipeCore.buildAudioButtonConfig(['./audio/fast.mp3', './audio/slow.mp3', './audio/extra.mp3']), [
    { key: 'fast', label: 'Fast', source: 'http://localhost/audio/fast.mp3' },
    { key: 'slow', label: 'Slow', source: 'http://localhost/audio/slow.mp3' },
  ]);
});

test('buildProjectRootUrl resolves site-root content paths without relative drift', () => {
  const previousLocation = globalThis.location;
  globalThis.location = { origin: 'https://esbendev.com', href: 'https://esbendev.com/shuo/other/experimentos/swipe/index.html', pathname: '/shuo/other/experimentos/swipe/index.html' };

  try {
    assert.equal(
      SwipeCore.buildProjectRootUrl('contenido', 'preguntas', 'cac', '1', 'week-1a.json'),
      'https://esbendev.com/shuo/contenido/preguntas/cac/1/week-1a.json'
    );

    assert.equal(
      SwipeCore.buildProjectRootUrl('/contenido/', 'preguntas/', '/cac/1/', 'week-1a.json'),
      'https://esbendev.com/shuo/contenido/preguntas/cac/1/week-1a.json'
    );
  } finally {
    globalThis.location = previousLocation;
  }
});

test('resolveMediaUrl normalizes repo-root absolute paths', () => {
  const previousLocation = globalThis.location;
  globalThis.location = { origin: 'https://esbendev.com', href: 'https://esbendev.com/shuo/other/experimentos/swipe/index.html', pathname: '/shuo/other/experimentos/swipe/index.html' };

  try {
    assert.equal(
      SwipeCore.resolveMediaUrl('/shuo/contenido/preguntas/cac/1/week-1a.json'),
      'https://esbendev.com/shuo/contenido/preguntas/cac/1/week-1a.json'
    );

    assert.equal(
      SwipeCore.resolveMediaUrl('/shuo/other/experimentos/voiceGen/audioFiles/daily-news/20261019/1_波特兰与俄勒冈州.mp3'),
      'https://esbendev.com/shuo/other/experimentos/voiceGen/audioFiles/daily-news/20261019/1_波特兰与俄勒冈州.mp3'
    );
  } finally {
    globalThis.location = previousLocation;
  }
});

test('resolveMediaUrl normalizes project-relative contenido paths', () => {
  const previousLocation = globalThis.location;
  globalThis.location = { origin: 'https://esbendev.com', href: 'https://esbendev.com/shuo/other/experimentos/swipe/index.html', pathname: '/shuo/other/experimentos/swipe/index.html' };

  try {
    assert.equal(
      SwipeCore.resolveMediaUrl('../contenido/audio/cac/2/lesson-6a/1.mp3'),
      'https://esbendev.com/shuo/contenido/audio/cac/2/lesson-6a/1.mp3'
    );

    assert.equal(
      SwipeCore.resolveMediaUrl('./contenido/audio/cac/2/lesson-6a/1.mp3'),
      'https://esbendev.com/shuo/contenido/audio/cac/2/lesson-6a/1.mp3'
    );
  } finally {
    globalThis.location = previousLocation;
  }
});

test('resolveMediaUrl preserves http and data URLs and resolves relative urls', () => {
  assert.equal(
    SwipeCore.resolveMediaUrl('https://example.com/audio/demo.mp3'),
    'https://example.com/audio/demo.mp3'
  );

  assert.equal(
    SwipeCore.resolveMediaUrl('./audio/demo.mp3'),
    'http://localhost/audio/demo.mp3'
  );

  assert.match(
    SwipeCore.resolveMediaUrl('data:audio/mpeg;base64,AAA='),
    /^data:audio\/mpeg;base64,/i
  );
});

test('getCardRenderIndex keeps the intro screen as the first visible card', () => {
  assert.deepEqual(
    [0, 1, 2].map((index) => SwipeCore.getCardRenderIndex(index, { includeIntroCard: true })),
    [1, 2, 3]
  );

  assert.deepEqual(
    [0, 1, 2].map((index) => SwipeCore.getCardRenderIndex(index, { includeIntroCard: false })),
    [0, 1, 2]
  );
});
