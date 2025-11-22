const CACHE_NAME = "esbendev-shuo-v251121";
const urlsToCache = [
    "/",
    "/index.html",
    "/estilos/General.css",
    "/estilos/estiloIndex.css",
    "/estilos/estiloPopup.css",
    "/estilos/Lector.css",
    "/imagenes/icon-192.png",
    "/imagenes/icon-512.png",
    "/actualizarMenu.js",
    "/contenido/preguntas/lista_dias.json",
    "/contenido/preguntas/tubh1_1.json",
    "/contenido/preguntas/tubh1_2.json",
    "/contenido/preguntas/tubh1_4.json",
    "/contenido/preguntas/tubh1_5.json",
    "/contenido/preguntas/tubh1_6_sentences.json",
    "/contenido/preguntas/tubh1_6_vocab.json",
    "/contenido/preguntas/tubh1_8_sentences.json",
    "/contenido/preguntas/tubh1_8_vocab.json",
    "/contenido/preguntas/tubh1_9.json",
    "/contenido/preguntas/tubh1_10_sentences.json",
    "/contenido/preguntas/tubh1_10_vocab.json",
    "/contenido/preguntas/tubh1_11_audio_2.json",
    "/contenido/preguntas/tubh1_11_audio.json",
    "/contenido/preguntas/tubh1_12_vocab.json",
    "/contenido/preguntas/tubh1_13_sentences.json",
    "/contenido/preguntas/tubh1_13_vocab.json",
    "/contenido/preguntas/tubh1_15_audio_2.json",
    "/contenido/preguntas/tubh1_15_audio.json",
    "/contenido/preguntas/tubh1_16_vocab.json",
    "/contenido/preguntas/tubh1_18_sentences.json",
    "/contenido/preguntas/tubh1_18_vocab.json",
    "/contenido/preguntas/tubh1_20_audio_2.json",
    "/contenido/preguntas/tubh1_20_audio.json",
    "/contenido/preguntas/tubh1_22_sentences.json",
    "/contenido/preguntas/tubh1_22_vocab.json",
    "/contenido/preguntas/tubh1_23_audio.json",
    "/contenido/preguntas/tubh1_26_audio_2.json",
    "/contenido/preguntas/tubh1_26_audio.json",
    "/contenido/preguntas/tubh1_30_audio_2.json",
    "/contenido/preguntas/tubh1_30_audio.json",
    "/contenido/preguntas/tubh1_33_vocab.json",
    "/contenido/preguntas/tubh1_34_vocab.json",
    "/contenido/preguntas/tubh1_36_audio_2.json",
    "/contenido/preguntas/tubh1_36_audio.json",
    "/other/experimentos/promt-generator.html",
    "/other/textos/day-28.html",
    "/other/textos/day-35.html",
    "/other/textos/day-38.html",
    "/other/textos/day-41.html",
    "/other/sentence-builder.html",
    "/cheatsheets/index.html"
];

self.addEventListener("install", (event) => {
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
});