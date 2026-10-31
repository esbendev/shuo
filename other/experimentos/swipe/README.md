# Swipe cache updater

Use this script to keep swipe-related precache entries in [sw.js](../../../sw.js) synced:

- swipe HTML/JS files in [other/experimentos/swipe/](.)
- daily-news JSON files in [other/experimentos/swipe/daily-news/](./daily-news)
- voiceGen daily-news manifests in [other/experimentos/voiceGen/audioFiles/daily-news/](../voiceGen/audioFiles/daily-news)
- CAC question JSON files in [contenido/preguntas/cac/](../../../contenido/preguntas/cac)

It also bumps `CACHE_NAME` in [sw.js](../../../sw.js) so clients pick up the updated cache.

## Run

From repo root:

```bash
node other/experimentos/swipe/update-sw-cache.js
```
