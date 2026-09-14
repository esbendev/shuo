# Anki Defluffer

Este proyecto extrae el contenido de una baraja de Anki (.apkg o .colpkg) y lo exporta en dos formatos útiles para estudiar vocabulario o revisar tarjetas de una forma más limpia y estructurada.

Está pensado para trabajar con mazos de chino, vocabulario, frases y otros decks donde conviene obtener una versión legible y otra versión formateada como HTML.

## ¿Qué hace?

El script `main.py` realiza estas tareas:

- importa un paquete de Anki (`.apkg` o `.colpkg`)
- lee todas las notas del mazo
- limpia cada campo eliminando saltos de línea innecesarios
- elimina etiquetas de audio tipo `[sound:...]`
- genera una salida en texto plano en `rawDecks/`
- genera otra salida formateada en HTML en `formatedDecks/`

Esto permite convertir mazos de Anki en archivos más fáciles de revisar, importar a otras herramientas, o estudiar directamente desde una vista más legible.

## Características principales

- compatible con paquetes de Anki `.apkg` y `.colpkg`
- crea carpetas de salida automáticamente si no existen
- normaliza campos de texto para evitar espacios raros o líneas rotas
- elimina contenido de audio no útil en los campos
- genera archivos `.txt` con columnas separadas por tabulaciones
- genera archivos HTML con un formato simple:
  - primer campo: caracteres chinos o texto principal
  - resto de campos: respuesta/formato de estudio

## Estructura del proyecto

```text
anki_defluffer/
├── main.py
├── test_main.py
└── README.md
```

## Requisitos

Necesitas Python 3 y la librería oficial de Anki instalada:

```bash
pip install anki
```

Si el entorno donde ejecutas el script no tiene Anki disponible, la aplicación mostrará un error indicando que debe instalarse `anki`.

## Uso

El comando base es:

```bash
python3 main.py <file.apkg|.colpkg> <ankiDecks_path> <result_name>
```

### Parámetros

1. `file.apkg|.colpkg`: ruta al archivo del mazo de Anki que quieres importar.
2. `ankiDecks_path`: carpeta donde se crearán las subcarpetas `rawDecks` y `formatedDecks`.
3. `result_name`: nombre base del archivo resultante. Si no incluye extensión, se añadirá `.txt` automáticamente.

## Ejemplos

### Exportar desde una ruta local

```bash
python3 main.py ./mi_deck.apkg ./ankiDecks Lesson4
```

Esto genera:

```text
./ankiDecks/rawDecks/Lesson4.txt
./ankiDecks/formatedDecks/Lesson4.txt
```

### Si el paquete está en otra carpeta

```bash
python3 main.py /ruta/a/mi_deck.apkg /ruta/a/ankiDecks MiMazo
```

## Salida generada

### 1) rawDecks

La versión `rawDecks` toma todos los campos de cada nota y los escribe como una línea separada por tabulaciones.

Ejemplo:

```text
你好 你好	hello	greeting
```

Esto es útil para:

- procesado posterior con scripts
- análisis de vocabulario
- conversión a otros formatos
- revisión rápida en un editor

### 2) formatedDecks

La versión `formatedDecks` genera una línea por nota en formato HTML simplificado.

Ejemplo:

```html
<div class="chineseChars">你好</div>|<div class="answer">你好 <span class="english">hello</span></div>
```

La lógica está diseñada para que:

- el primer campo quede como texto principal
- si hay más de un campo, se concatena el resto como respuesta
- si el último campo se interpreta como traducción en inglés, se envuelve en un `<span class="english">`

## Cómo se limpian los datos

El script normaliza cada valor con la siguiente lógica:

- elimina etiquetas `[sound:...]`
- convierte `\r\n` y saltos de línea a espacios
- elimina múltiples espacios entre palabras
- quita espacios al inicio y al final

Esto ayuda a que los textos exportados se vean más limpios y consistentes, especialmente cuando se importan mazos con contenido de audio o texto con formato irregular.

## Qué pasa por dentro

El flujo principal en `main.py` es el siguiente:

1. valida que el archivo tenga extensión soportada
2. crea las carpetas de salida
3. importa el paquete con la API nativa de Anki
4. obtiene todas las notas del mazo
5. exporta una versión cruda y otra formateada
6. cierra la colección y termina

## Funciones clave

### `build_output_path(anki_decks_path, result_name, subdir_name)`

Construye la ruta final de salida dentro de una subcarpeta.

- asegura que la carpeta exista
- valida que `result_name` no esté vacío
- añade la extensión `.txt` si no se incluye

### `normalize_field(value)`

Limpia un campo individual:

- elimina contenido de audio
- normaliza espacios y saltos de línea
- devuelve texto limpio

### `build_formatted_answer(fields)`

Combina los campos de respuesta en un formato de estudio legible.

### `format_note_as_html(note)`

Convierte una nota de Anki en una línea HTML compacta para ser usada en un visor o en material de estudio.

### `extract_with_anki_api(package_path, anki_decks_path, result_name)`

Función principal que realiza la extracción real del mazo.

## Casos de uso típicos

Este script es útil cuando quieres:

- convertir mazos de Anki a texto para revisarlos en un editor o navegador
- preparar decks para análisis o procesamiento con otros scripts
- generar materiales de estudio más legibles
- limpiar notas con audio o campos con formato extraño
- extraer vocabulario o frases para ser estudiadas en otro contexto

## Solución de problemas

### Error: "The Anki Python package is not installed"

Instala la dependencia:

```bash
pip install anki
```

### Error: archivo no encontrado

Verifica que la ruta del `.apkg` o `.colpkg` sea correcta.

### Error: formato no soportado

Solo se admiten archivos con extensión:

- `.apkg`
- `.colpkg`

### La salida no se genera

Asegúrate de que:

- la carpeta de destino exista o pueda crearse
- el nombre de archivo sea válido
- el mazo de Anki no esté corrupto

## Pruebas

El proyecto incluye una prueba básica de contrato en `test_main.py` para verificar que la ruta de salida se construye correctamente.

Puedes ejecutarla con:

```bash
python3 -m unittest test_main.py
```

## Ejemplo de flujo completo

```bash
python3 main.py ./decks/lesson4.apkg ./ankiDecks Lesson4
ls -R ./ankiDecks
```

Luego revisa:

- `./ankiDecks/rawDecks/Lesson4.txt`
- `./ankiDecks/formatedDecks/Lesson4.txt`

## Notas importantes

- El script no modifica ni sobrescribe el mazo original de Anki.
- Solo genera archivos nuevos en la carpeta de destino.
- La salida raw es útil para automatización y análisis.
- La salida formateada es útil para estudio visual y revisión más agradable.

## Conclusión

`anki_defluffer` es una herramienta pequeña pero muy útil para convertir mazos de Anki a formatos más manejables, limpiando el contenido y preparándolo para estudio o procesamiento posterior.

Es especialmente útil para mazos de vocabulario o frases en idiomas como el chino, donde muchos campos contienen audio, pinyin, traducciones o formato múltiple.
