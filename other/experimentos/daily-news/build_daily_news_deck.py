#!/usr/bin/env python3
import json
import os
import re
from pathlib import Path

base = Path(__file__).resolve().parent
repo_root = base.parents[2]
source_dir = base / 'news'
voice_dir = repo_root / 'other' / 'experimentos' / 'voiceGen' / 'audioFiles' / 'daily-news'
out_dir = repo_root / 'other' / 'experimentos' / 'swipe' / 'daily-news'
out_dir.mkdir(parents=True, exist_ok=True)
base_path = os.environ.get('SITE_BASE_PATH', '/shuo').strip()
if not base_path or base_path == '/':
    base_path = ''


def normalize_audio_url(audio_value: str | None) -> str:
    if not audio_value:
        return ''
    audio_path = Path(audio_value)
    if not audio_path.is_absolute():
        audio_path = (repo_root / audio_path).resolve()
    relative_path = audio_path.relative_to(repo_root.resolve()).as_posix()
    if base_path:
        return f"{base_path.rstrip('/')}/{relative_path}"
    return f"/{relative_path}"


def strip_markdown(text: str) -> str:
    return re.sub(r'[*_]+', '', text).strip()


def is_short_topic(line: str) -> bool:
    text = re.sub(r'\s+', '', strip_markdown(line)).strip()
    if not text or text.startswith('#'):
        return False
    if re.search(r'[。！？!?]', text):
        return False
    return len(text) <= 5


def looks_like_topic(line: str) -> bool:
    text = re.sub(r'\s+', '', strip_markdown(line)).strip()
    if not text or text.startswith('#'):
        return False
    if re.search(r'[。！？!?]', text):
        return False
    if len(text) > 30:
        return False
    return len(text) > 5


def split_sentences(text: str):
    cleaned = strip_markdown(re.sub(r'\s+', ' ', text).strip())
    if not cleaned:
        return []
    chunks = re.split(r'(?<=[。！？!?])\s*', cleaned)
    sentences = [chunk.strip() for chunk in chunks if chunk.strip()]
    if not sentences:
        sentences = [cleaned]
    return sentences


def extract_cards(source_file: Path):
    entries = []
    current_topic = 'Daily News'
    for raw_line in source_file.read_text(encoding='utf-8').splitlines():
        line = strip_markdown(raw_line).strip()
        if not line or line.startswith('#'):
            continue
        if is_short_topic(line):
            current_topic = line
            continue
        if looks_like_topic(line):
            current_topic = line
            entries.append({'topic': current_topic, 'text': current_topic})
            continue
        for sentence in split_sentences(line):
            entries.append({'topic': current_topic, 'text': sentence})

    if not entries:
        for sentence in split_sentences(source_file.read_text(encoding='utf-8')):
            entries.append({'topic': 'Daily News', 'text': sentence})

    return entries


def display_date(date_slug: str) -> str:
    if len(date_slug) == 8 and date_slug.isdigit():
        return f'{date_slug[:4]}-{date_slug[4:6]}-{date_slug[6:8]}'
    return date_slug


def build_deck(source_file: Path):
    date_slug = source_file.stem
    manifest_path = voice_dir / date_slug / 'manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else []
    cards = extract_cards(source_file)

    questions = []
    for idx, card in enumerate(cards, start=1):
        manifest_item = manifest[idx - 1] if idx - 1 < len(manifest) else {}
        question = {
            'id': idx,
            'topic': card['topic'],
            'archivo_audio': normalize_audio_url(manifest_item.get('audio')),
            'respuesta_correcta': [card['text']],
            'texto_en_ingles': '',
        }
        questions.append(question)

    payload = {
        'titulo': f'Daily News {display_date(date_slug)}',
        'showHelp': True,
        'preguntas': questions,
    }

    outfile = out_dir / f'daily-news-{date_slug}.json'
    outfile.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return outfile


if __name__ == '__main__':
    source_files = sorted(source_dir.glob('*.txt'))
    if not source_files:
        raise SystemExit(f'No .txt files found in {source_dir}')

    generated = []
    for source_file in source_files:
        outfile = build_deck(source_file)
        generated.append(outfile)
        print(f'Wrote {outfile}')

    deck_list = repo_root / 'other' / 'experimentos' / 'swipe' / 'daily-news-list.html'
    items = '\n'.join(
        f'                <li><a href="./daily-news.html?file={json_path.stem}"><span>{json_path.stem}</span><span class="jump">Open</span></a></li>'
        for json_path in sorted(out_dir.glob('daily-news-*.json'))
    )
    deck_list.write_text(
        f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Daily News Decks</title>
    <style>
        :root {{
            --bg: #f3f1ec;
            --panel: #fffdf8;
            --text: #1f2426;
            --muted: #5b676d;
            --line: #d4d9d6;
            --accent: #1f6b68;
            --accent-strong: #0f4f4c;
        }}
        * {{ box-sizing: border-box; }}
        body {{
            margin: 0;
            font-family: "Avenir Next", "Segoe UI", Tahoma, sans-serif;
            color: var(--text);
            background: radial-gradient(circle at top right, #e8f0eb, var(--bg) 42%);
            min-height: 100vh;
        }}
        .wrap {{ max-width: 760px; margin: 0 auto; padding: 24px 16px 36px; }}
        h1 {{ font-size: clamp(1.7rem, 5vw, 2.2rem); margin: 0; color: #17373a; }}
        .subtitle {{ margin: 8px 0 20px; color: var(--muted); font-size: 1rem; line-height: 1.45; }}
        .panel {{ background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 14px; }}
        h2 {{ font-size: 1.05rem; margin: 6px 0 10px; color: #2a3f46; letter-spacing: 0.02em; }}
        ul {{ list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }}
        li {{ margin: 0; }}
        a {{ display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; text-decoration: none; color: var(--text); background: #f9faf8; font-weight: 600; line-height: 1.35; }}
        a:hover, a:focus-visible {{ border-color: #b6cac4; outline: none; background: #f1f6f3; }}
        .jump {{ color: var(--accent); font-size: 0.9rem; font-weight: 700; white-space: nowrap; }}
    </style>
</head>
<body>
    <main class="wrap">
        <h1>Daily News Decks</h1>
        <p class="subtitle">Choose a deck and pass it via the file query parameter.</p>

        <section class="panel">
            <ul>
{items}
            </ul>
        </section>
    </main>
</body>
</html>
''',
        encoding='utf-8',
    )
    print(f'Updated {deck_list}')
