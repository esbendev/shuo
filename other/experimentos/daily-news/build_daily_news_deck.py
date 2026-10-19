#!/usr/bin/env python3
import json
from pathlib import Path

base = Path(__file__).resolve().parent
source = base / 'news' / '20261019.txt'
manifest_path = Path('/home/esbendev/esbendev/repos/shuo/other/experimentos/voiceGen/audioFiles/daily-news/manifest.json')
out_dir = Path('/home/esbendev/esbendev/repos/shuo/other/experimentos/swipe/daily-news')
out_dir.mkdir(parents=True, exist_ok=True)

text = source.read_text(encoding='utf-8')
lines = [line.strip() for line in text.splitlines()]
entries = []
current_topic = None
for raw in lines:
    if not raw:
        continue
    if raw.endswith('州') or raw.endswith('马拉') or raw.endswith('根廷') or raw.endswith('州'):
        current_topic = raw
        continue
    if raw.startswith('#'):
        continue
    current_topic = current_topic or 'Daily News'
    entries.append((current_topic, raw))

manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
questions = []
repo_root = Path('/home/esbendev/esbendev/repos/shuo')
for idx, item in enumerate(manifest, start=1):
    slug = item['slug']
    audio = str(Path(item['audio']).relative_to(repo_root)).replace('\\', '/')
    audio = '/' + audio
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
    else:
        topic = current_topic or 'Daily News'
        chinese = slug.replace('_', ' ')
        english = ''

    questions.append({
        'id': idx,
        'topic': topic,
        'archivo_audio': audio,
        'respuesta_correcta': [chinese],
        'texto_en_ingles': english,
    })

payload = {
    'titulo': 'Daily News 2026-10-19',
    'showHelp': True,
    'preguntas': questions,
}

outfile = out_dir / 'daily-news-20261019.json'
outfile.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Wrote {outfile}')
