#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
API_URL="${API_URL:-http://localhost:5050/v1/audio/speech}"
# AUTH_TOKEN="${AUTH_TOKEN:-${OPENAI_API_KEY:-}}"
AUTH_TOKEN="${AUTH_TOKEN:-your_api_key_here}"
VOICE="${VOICE:-zh-CN-XiaoxiaoNeural}"

usage() {
  echo "Usage: $0 <input_txt> <output_dir> [voice]"
  echo "Example: $0 ../daily-news/news/20261019.txt audioFiles/daily-news zh-CN-YunxiNeural"
}

if [ "$#" -lt 2 ] || [ "$#" -gt 3 ]; then
  usage
  exit 1
fi

INPUT_FILE="$1"
OUTPUT_DIR="$2"
if [ "$#" -eq 3 ]; then
  VOICE="$3"
fi

if [ "${INPUT_FILE#/}" = "$INPUT_FILE" ] && [ ! -f "$INPUT_FILE" ]; then
  alt_input="${SCRIPT_DIR}/${INPUT_FILE}"
  if [ -f "$alt_input" ]; then
    INPUT_FILE="$alt_input"
  fi
fi

if [ ! -f "$INPUT_FILE" ]; then
  echo "❌ Input file not found: $INPUT_FILE"
  exit 1
fi

if [ "${OUTPUT_DIR#/}" = "$OUTPUT_DIR" ]; then
  if [ ! -e "$OUTPUT_DIR" ]; then
    OUTPUT_DIR="${SCRIPT_DIR}/${OUTPUT_DIR}"
  fi
fi

SOURCE_STEM="$(basename "${INPUT_FILE%.*}")"
if [ "$(basename "$OUTPUT_DIR")" != "$SOURCE_STEM" ]; then
  OUTPUT_DIR="${OUTPUT_DIR%/}/${SOURCE_STEM}"
fi

mkdir -p "$OUTPUT_DIR"

if [ -z "${AUTH_TOKEN:-}" ]; then
  echo "❌ Missing auth token. Set AUTH_TOKEN or OPENAI_API_KEY before running this script."
  exit 1
fi

count=1
manifest_entries=""

while IFS= read -r line || [ -n "$line" ]; do
  line="${line#${line%%[![:space:]]*}}"
  line="${line%${line##*[![:space:]]}}"

  [ -z "$line" ] && continue
  case "$line" in
    \#*) continue ;;
  esac

  sentence_entries=$(python3 - "$line" <<'PY'
import re, sys
text = sys.argv[1].strip()
if not text:
    raise SystemExit
text = re.sub(r'\*\*+', '', text)
text = text.replace('*', '')
chunks = re.split(r'(?<=[。！？.!?])', text)
items = []
for chunk in chunks:
    chunk = chunk.strip()
    if not chunk:
        continue
    if len(chunk) <= 5 and not any(p in chunk for p in '。！？.!?'):
        continue
    items.append(chunk)
if not items and len(text) > 5:
    items = [text]
print('\n'.join(items))
PY
)

  while IFS= read -r sentence; do
    [ -z "$sentence" ] && continue
    sentence="${sentence#${sentence%%[![:space:]]*}}"
    sentence="${sentence%${sentence##*[![:space:]]}}"
    [ -z "$sentence" ] && continue
    sentence=$(python3 - "$sentence" <<'PY'
import re, sys
text = sys.argv[1]
text = re.sub(r'\*\*+', '', text)
text = text.replace('*', '')
print(text.strip())
PY
)

    safe_name=$(python3 - "$sentence" "$count" <<'PY'
import re, sys
text = sys.argv[1]
index = sys.argv[2]
text = re.sub(r'[^\w\u4e00-\u9fff]+', '_', text, flags=re.UNICODE)
text = re.sub(r'_+', '_', text).strip('_')
if not text:
    text = f"sentence_{index}"
print(text[:80])
PY
)

    output_file="${OUTPUT_DIR}/${count}_${safe_name}.mp3"
    payload=$(python3 - "$sentence" "$VOICE" <<'PY'
import json, sys
text = sys.argv[1]
voice = sys.argv[2]
print(json.dumps({"model": "tts-1", "input": text, "voice": voice}))
PY
)

    echo "🎧 Generating ${count}: ${sentence}"
    curl -sS \
      -H "Authorization: Bearer ${AUTH_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$payload" \
      "$API_URL" \
      -o "$output_file"

    if [ -n "$manifest_entries" ]; then
      manifest_entries+=","
    fi
    manifest_entries+=$(python3 - "$count" "$safe_name" "$output_file" <<'PY'
import json, sys
idx, safe_name, output_file = sys.argv[1], sys.argv[2], sys.argv[3]
print(json.dumps({"id": int(idx), "slug": safe_name, "audio": output_file}, ensure_ascii=False))
PY
)

    count=$((count + 1))
  done <<< "$sentence_entries"
done < "$INPUT_FILE"

manifest_file="${OUTPUT_DIR}/manifest.json"
python3 - "$manifest_file" "$manifest_entries" <<'PY'
import json, sys
path, entries = sys.argv[1], sys.argv[2]
if not entries:
    data = []
else:
    data = json.loads('[' + entries + ']')
with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write('\n')
PY

# The TTS script is responsible for audio generation. Once the manifest and mp3 files exist,
# trigger the dedicated daily-news deck builder to regenerate the swipe JSON and list.
python3 "${SCRIPT_DIR}/../daily-news/build_daily_news_deck.py" > /dev/null

echo
printf '✅ Created %s audio files in %s\n' "$((count - 1))" "$OUTPUT_DIR"
echo "Manifest: $manifest_file"
