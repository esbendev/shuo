const CACHE_NAME = "esbendev-shuo-v251124-1";
const urlsToCache = [
    "/shuo/",
    "/shuo/index.html",
    "/shuo/estilos/General.css",
    "/shuo/estilos/estiloIndex.css",
    "/shuo/estilos/estiloPopup.css",
    "/shuo/estilos/Lector.css",
    "/shuo/imagenes/icon-192.png",
    "/shuo/imagenes/icon-512.png",
    "/shuo/actualizarMenu.js",
    "/shuo/contenido/preguntas/lista_dias.json",
    "/shuo/contenido/preguntas/tubh1_1.json",
    "/shuo/contenido/preguntas/tubh1_2.json",
    "/shuo/contenido/preguntas/tubh1_4.json",
    "/shuo/contenido/preguntas/tubh1_5.json",
    "/shuo/contenido/preguntas/tubh1_6_sentences.json",
    "/shuo/contenido/preguntas/tubh1_6_vocab.json",
    "/shuo/contenido/preguntas/tubh1_8_sentences.json",
    "/shuo/contenido/preguntas/tubh1_8_vocab.json",
    "/shuo/contenido/preguntas/tubh1_9.json",
    "/shuo/contenido/preguntas/tubh1_10_sentences.json",
    "/shuo/contenido/preguntas/tubh1_10_vocab.json",
    "/shuo/contenido/preguntas/tubh1_11_audio_2.json",
    "/shuo/contenido/preguntas/tubh1_11_audio.json",
    "/shuo/contenido/preguntas/tubh1_12_vocab.json",
    "/shuo/contenido/preguntas/tubh1_13_sentences.json",
    "/shuo/contenido/preguntas/tubh1_13_vocab.json",
    "/shuo/contenido/preguntas/tubh1_15_audio_2.json",
    "/shuo/contenido/preguntas/tubh1_15_audio.json",
    "/shuo/contenido/preguntas/tubh1_16_vocab.json",
    "/shuo/contenido/preguntas/tubh1_18_sentences.json",
    "/shuo/contenido/preguntas/tubh1_18_vocab.json",
    "/shuo/contenido/preguntas/tubh1_20_audio_2.json",
    "/shuo/contenido/preguntas/tubh1_20_audio.json",
    "/shuo/contenido/preguntas/tubh1_22_sentences.json",
    "/shuo/contenido/preguntas/tubh1_22_vocab.json",
    "/shuo/contenido/preguntas/tubh1_23_audio.json",
    "/shuo/contenido/preguntas/tubh1_26_audio_2.json",
    "/shuo/contenido/preguntas/tubh1_26_audio.json",
    "/shuo/contenido/preguntas/tubh1_30_audio_2.json",
    "/shuo/contenido/preguntas/tubh1_30_audio.json",
    "/shuo/contenido/preguntas/tubh1_33_vocab.json",
    "/shuo/contenido/preguntas/tubh1_34_vocab.json",
    "/shuo/contenido/preguntas/tubh1_36_audio.json",
    "/shuo/contenido/preguntas/tubh1_36_audio_2.json",
    "/shuo/contenido/preguntas/tubh1_42_audio.json",
    "/shuo/contenido/preguntas/tubh1_42_audio_2.json",
    "/shuo/other/experimentos/promt-generator.html",
    "/shuo/other/textos/day-28.html",
    "/shuo/other/textos/day-35.html",
    "/shuo/other/textos/day-38.html",
    "/shuo/other/textos/day-41.html",
    "/shuo/other/textos/day-44.html",
    "/shuo/other/sentence-builder.html",
    "/shuo/cheatsheets/index.html"
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