const CACHE_NAME = "esbendev-shuo-v260216-2";
const urlsToCache = [
    // general
    "/shuo/",
    "/shuo/index.html",
    "/shuo/estilos/estiloGeneral.css",
    "/shuo/estilos/estiloIndex.css",
    "/shuo/estilos/estiloPopup.css",
    "/shuo/estilos/estiloLector.css",
    "/shuo/imagenes/icon-192.png",
    "/shuo/imagenes/icon-512.png",
    "/shuo/actualizarMenu.js",
    // tubh 1
    "/shuo/contenido/preguntas/tubh/1/lista_dias.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_1.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_2.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_4.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_5.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_6_sentences.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_6_vocab.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_8_sentences.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_8_vocab.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_9.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_10_sentences.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_10_vocab.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_11_audio_2.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_11_audio.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_12_vocab.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_13_sentences.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_13_vocab.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_15_audio_2.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_15_audio.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_16_vocab.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_18_sentences.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_18_vocab.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_20_audio_2.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_20_audio.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_22_sentences.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_22_vocab.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_23_audio.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_26_audio_2.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_26_audio.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_30_audio_2.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_30_audio.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_33_vocab.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_34_vocab.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_36_audio.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_36_audio_2.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_42_audio.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_42_audio_2.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_48_audio.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_48_audio_2.json",
    "/shuo/contenido/preguntas/tubh/1/tubh1_rapidos.json",
    // tubh 2
    "/shuo/contenido/preguntas/tubh/2/lista_dias.json",
    "/shuo/contenido/preguntas/tubh/2/tubh2_5_audio.json",
    "/shuo/contenido/preguntas/tubh/2/tubh2_5_audio_2.json",
    "/shuo/contenido/preguntas/tubh/2/tubh2_5_audio_3.json",
    "/shuo/contenido/preguntas/tubh/2/tubh2_5_audios_rapidos.json",
    "/shuo/contenido/preguntas/tubh/2/tubh2_11_audio.json",
    "/shuo/contenido/preguntas/tubh/2/tubh2_11_audio_2.json",
    "/shuo/contenido/preguntas/tubh/2/tubh2_11_audio_3.json",
    "/shuo/contenido/preguntas/tubh/2/tubh2_11_audios_rapidos.json",
    "/shuo/contenido/preguntas/tubh/2/tubh2_18_audio.json",
    "/shuo/contenido/preguntas/tubh/2/tubh2_18_audio_2.json",
    "/shuo/contenido/preguntas/tubh/2/tubh2_18_audio_3.json",
    "/shuo/contenido/preguntas/tubh/2/tubh2_18_audios_rapidos.json",
    // (other)
    "/shuo/other/experimentos/prompt-generator.html",
    // textos tubh1
    "/shuo/other/textos/tubh/1/day-28.html",
    "/shuo/other/textos/tubh/1/day-35.html",
    "/shuo/other/textos/tubh/1/day-38.html",
    "/shuo/other/textos/tubh/1/day-41.html",
    "/shuo/other/textos/tubh/1/day-44.html",
    // textos tubh2
    "/shuo/other/textos/tubh/2/day-4.html",
    "/shuo/other/textos/tubh/2/day-10.html",
    "/shuo/other/textos/tubh/2/day-13.html",
    "/shuo/other/textos/tubh/2/day-17.html",
    // other 2 (?
    "/shuo/other/sentence-builder.html",
    "/shuo/cheatsheets/index.html",
    "/shuo/other/experimentos/time.html",
    "/shuo/other/experimentos/dates.html",
    // nuevo experimento para practicar audios
    "/shuo/other/experimentos/swipe/logica-tarjetitas.js",
    "/shuo/other/experimentos/swipe/index.html"
];

self.addEventListener("install", (event) => {
    self.skipWaiting(); // Force the new service worker to activate immediately
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener("activate", (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim(); // Take control of all clients immediately
});