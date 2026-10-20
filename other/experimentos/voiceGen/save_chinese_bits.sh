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

python3 - "$INPUT_FILE" "$OUTPUT_DIR" "$SCRIPT_DIR" <<'PY'
import json
import os
import sys
from pathlib import Path

source_file = Path(sys.argv[1]).resolve()
output_dir = Path(sys.argv[2]).resolve()
script_dir = Path(sys.argv[3]).resolve()
repo_root = script_dir.parents[2]
base_path = os.environ.get('SITE_BASE_PATH', '/shuo').strip()
if not base_path or base_path == '/':
    base_path = ''
manifest_path = output_dir / 'manifest.json'
if not manifest_path.exists():
    raise SystemExit(f'Manifest not found: {manifest_path}')

manifest = json.loads(manifest_path.read_text(encoding='utf-8'))

def slug_to_text(slug: str) -> str:
    return slug.replace('_', ' ')

questions = []
for index, item in enumerate(manifest, start=1):
    slug = item['slug']
    audio_abs = Path(item['audio'])
    if not audio_abs.is_absolute():
        audio_abs = (repo_root / audio_abs).resolve()
    else:
        audio_abs = audio_abs.resolve()
    relative_audio = audio_abs.relative_to(repo_root.resolve())
    audio_url = f"{base_path.rstrip('/')}/{relative_audio.as_posix()}" if base_path else '/' + relative_audio.as_posix()

    topic = 'Daily News'
    chinese = slug_to_text(slug)
    english = ''

    if slug == '波特兰与俄勒冈州':
        topic = '波特兰与俄勒冈州'
        chinese = '波特兰与俄勒冈州'
        english = 'Portland and Oregon'
    elif slug == '最近在俄勒冈州发生了一件非常重要的事情':
        topic = '俄勒冈州'
        chinese = '最近在俄勒冈州发生了一件非常重要的事情。'
        english = 'Something very important happened recently in Oregon.'
    elif slug == '警察在调查一起学校的事情_新闻也报道了很多细节':
        topic = '俄勒冈州'
        chinese = '警察在调查一起学校的事情，新闻也报道了很多细节。'
        english = 'Police are investigating a school case, and the news reported many details.'
    elif slug == '很多居民觉得大家需要互相帮助_希望城市可以越来越安全':
        topic = '俄勒冈州'
        chinese = '很多居民觉得大家需要互相帮助，希望城市可以越来越安全。'
        english = 'Many residents feel the community needs to help one another and hope the city becomes safer.'
    elif slug == '在危地马拉_最近的新闻报道了一件严肃的事情':
        topic = '危地马拉'
        chinese = '在危地马拉，最近的新闻报道了一件严肃的事情。'
        english = 'In Guatemala, recent news reported a serious incident.'
    elif slug == '一位著名的律师遇到了袭击':
        topic = '危地马拉'
        chinese = '一位著名的律师遇到了袭击。'
        english = 'A well-known lawyer was attacked.'
    elif slug == '警察马上开始调查这起案件_很多人希望政府可以帮助维护社会的安全':
        topic = '危地马拉'
        chinese = '警察马上开始调查这起案件，很多人希望政府可以帮助维护社会的安全。'
        english = 'Police immediately began investigating the case, and many people hope the government will help maintain public safety.'
    elif slug == '在阿根廷_最近布宜诺斯艾利斯有很多人在路上参加游行':
        topic = '阿根廷'
        chinese = '在阿根廷，最近布宜诺斯艾利斯有很多人在路上参加游行。'
        english = 'In Argentina, many people recently took part in a march in Buenos Aires.'
    elif slug == '因为大学的预算问题_很多学生和老师觉得现在的情况比较困难':
        topic = '阿根廷'
        chinese = '因为大学的预算问题，很多学生和老师觉得现在的情况比较困难。'
        english = 'Because of budget problems at the university, many students and teachers feel the situation is difficult.'
    elif slug == '大家希望政府可以帮助解决经济问题':
        topic = '阿根廷'
        chinese = '大家希望政府可以帮助解决经济问题。'
        english = 'People hope the government can help solve the economic problems.'

    questions.append({
        'id': index,
        'topic': topic,
        'archivo_audio': audio_url,
        'respuesta_correcta': [chinese],
        'texto_en_ingles': english,
    })

stem = source_file.stem
file_name = 'daily-news-20261019.json' if stem == '20261019' else f'daily-news-{stem}.json'
deck_dir = repo_root / 'other' / 'experimentos' / 'swipe' / 'daily-news'
deck_dir.mkdir(parents=True, exist_ok=True)
output_path = deck_dir / file_name
payload = {
    'titulo': f'Daily News {stem}',
    'showHelp': True,
    'preguntas': questions,
}
output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Wrote deck: {output_path}')
PY

echo
printf '✅ Created %s audio files in %s\n' "$((count - 1))" "$OUTPUT_DIR"
echo "Manifest: $manifest_file"
