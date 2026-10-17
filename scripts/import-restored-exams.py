"""지정한 CC BY 복원 게시글을 텍스트·코드·표·이미지 데이터로 정규화합니다.

실행 결과는 기계적 변환 자료입니다. 정답/해설 검수 없이 배포하지 않습니다.
표준 라이브러리만 사용하며 외부 HTML을 실행하거나 그대로 렌더링하지 않습니다.
"""
import argparse
import concurrent.futures
import hashlib
import json
import re
import sys
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'tmp' / 'restored-exams'
SOURCES = [(2026, 2, 562), (2026, 1, 561), (2025, 3, 558), (2025, 2, 554), (2025, 1, 540), (2024, 3, 495), (2024, 2, 483), (2024, 1, 476), (2023, 3, 453), (2023, 2, 420), (2023, 1, 372)]
VOID = {'img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'wbr', 'area', 'embed'}


class Node:
    def __init__(self, tag='', attrs=None):
        self.tag, self.attrs, self.children = tag, dict(attrs or []), []

    def all(self, predicate):
        for child in self.children:
            if isinstance(child, Node):
                if predicate(child):
                    yield child
                yield from child.all(predicate)


class Parser(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.root = Node('root')
        self.stack = [self.root]
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if self.stack[-1].tag == tag:
            self.stack.pop()

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                self.stack = self.stack[:i]
                return

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def text(node):
    if isinstance(node, str):
        return node.replace('\xa0', ' ')
    if node.tag in {'script', 'style'}:
        return ''
    if node.tag == 'br':
        return '\n'
    return ''.join(text(child) + ('\n' if isinstance(child, Node) and child.tag in {'p', 'li', 'div', 'tr'} else '') for child in node.children)


def clean(value):
    return re.sub(r'[ \t]+', ' ', value).strip()


def blocks(node):
    if node.tag in {'script', 'style', 'ins', 'iframe'} or 'revenue_unit' in node.attrs.get('class', ''):
        return []
    if 'colorscripter-code' in node.attrs.get('class', '').split():
        table = next(node.all(lambda n: n.tag == 'table'), None)
        cells = list(table.all(lambda n: n.tag == 'td')) if table else []
        if len(cells) >= 2:
            lines = list(cells[1].all(lambda n: n.tag == 'div' and 'white-space' in n.attrs.get('style', '')))
            code = '\n'.join(text(line).rstrip('\n') for line in lines) if lines else text(cells[1])
            return [{'type': 'code', 'text': code.strip('\n')}]
    if node.tag == 'img':
        src = node.attrs.get('src', '')
        return [{'type': 'image', 'source': src}] if src.startswith('https://') else []
    if node.tag == 'pre':
        return [{'type': 'code', 'text': text(node).strip('\n')}]
    if node.tag == 'table':
        cells = list(node.all(lambda n: n.tag == 'td'))
        if len(cells) >= 2 and len(re.findall(r'\d+', text(cells[0]))) >= 3 and re.fullmatch(r'[\d\s]+', text(cells[0])):
            code = text(cells[1]).split('Colored by Color Scripter')[0]
            return [{'type': 'code', 'text': re.sub(r'\n[ \t]*\n', '\n', code).strip('\n')}]
        rows = [[clean(text(cell)) for cell in row.children if isinstance(cell, Node) and cell.tag in {'td', 'th'}] for row in node.all(lambda n: n.tag == 'tr')]
        return [{'type': 'table', 'rows': [row for row in rows if row]}]
    if node.tag in {'p', 'li', 'blockquote'} and not list(node.all(lambda n: n.tag in {'img', 'table', 'pre'})):
        value = clean(text(node))
        return [{'type': 'text', 'text': value}] if value and value not in {'더보기', '반응형'} else []
    result = []
    for child in node.children:
        if isinstance(child, Node):
            result.extend(blocks(child))
        elif clean(child):
            result.append({'type': 'text', 'text': clean(child)})
    return result


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (educational source verification)'})
    with urllib.request.urlopen(req, timeout=30) as response:
        data = response.read(8_000_001)
        if len(data) > 8_000_000:
            raise ValueError('Asset exceeds 8 MB')
        return data


def parse_source(source):
    year, session, post = source
    url = f'https://chobopark.tistory.com/{post}'
    path = CACHE / f'{post}.html'
    if not path.exists():
        path.write_bytes(fetch(url))
    raw = path.read_text(encoding='utf-8')
    if 'creativecommons.org/licenses/by/4.0/' not in raw:
        raise ValueError(f'{post}: CC BY 4.0 표시 확인 실패')
    root = Parser(raw).root
    article = next(root.all(lambda n: 'tt_article_useless_p_margin' in n.attrs.get('class', '')))
    questions, current = [], None
    for node in article.children:
        if not isinstance(node, Node):
            continue
        value = clean(text(node))
        if current and len(questions) == 20 and value.startswith('클릭하면'):
            break
        is_answer = node.attrs.get('data-ke-type') == 'moreLess' or 'moreless' in node.attrs.get('class', '').lower()
        if is_answer and current:
            current['answerBlocks'].extend(blocks(node))
            current['answerBlocks'] = [b for b in current['answerBlocks'] if b.get('text') not in {'더보기', '접기'}]
            continue
        match = re.match(r'^(\d{1,2})[.)]\s*(.*)', value, re.S)
        is_heading = match and (re.search(r'다음|아래|하시오', match[2]) or re.match(r'(?:두 호스트|리눅스|C언어|IP (?:패킷|주소)|\[학생\]|데이터베이스|스케줄링|HDLC|패킷 교환|관계형)', match[2]))
        if is_heading and int(match[1]) == len(questions) + 1 and node.tag in {'p', 'h3', 'h4', 'div'}:
            current = {'id': f'past-{year}-{session}-q{match[1]}', 'number': int(match[1]), 'title': f'{year}년 {session}회 {match[1]}번', 'blocks': [], 'answerBlocks': []}
            questions.append(current)
        if current:
            current['blocks'].extend(blocks(node))
    if [q['number'] for q in questions] != list(range(1, 21)):
        raise ValueError(f'{post}: 문제 번호 누락 {[q["number"] for q in questions]}')
    return {'id': f'{year}-{session}', 'year': year, 'session': session, 'sourceUrl': url, 'author': 'Life-Journey', 'license': 'https://creativecommons.org/licenses/by/4.0/', 'sourceSha256': hashlib.sha256(raw.encode()).hexdigest(), 'questions': questions}


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    args = argparse.ArgumentParser()
    args.add_argument('--assets', action='store_true')
    args.add_argument('--inspect', action='store_true')
    options = args.parse_args()
    CACHE.mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        exams = list(pool.map(parse_source, SOURCES))
    if options.assets:
        folder = ROOT / 'public' / 'restored-exams'
        folder.mkdir(parents=True, exist_ok=True)
        for exam in exams:
            for question in exam['questions']:
                if question['id'] == 'past-2023-3-q17':
                    continue
                images = [b for part in ['blocks', 'answerBlocks'] for b in question[part] if b['type'] == 'image']
                for i, block in enumerate(images):
                    host = urlparse(block['source']).hostname or ''
                    if not (host.endswith('.kakaocdn.net') or host.endswith('.daumcdn.net') or host.endswith('.daum.net')):
                        raise ValueError(f'예상하지 않은 이미지 호스트: {host}')
                    name = f'{exam["id"]}-q{question["number"]}-{i + 1}.png'
                    target = next((folder / Path(name).with_suffix('.' + ext) for ext in ['png', 'jpg', 'webp'] if (folder / Path(name).with_suffix('.' + ext)).exists()), folder / name)
                    if not target.exists():
                        target.write_bytes(fetch(block['source']))
                    magic = target.read_bytes()[:12]
                    ext = '.png' if magic.startswith(b'\x89PNG') else '.jpg' if magic.startswith(b'\xff\xd8') else '.webp' if magic.startswith(b'RIFF') and magic[8:] == b'WEBP' else None
                    if ext is None:
                        raise ValueError(f'지원하지 않는 이미지 형식: {target.name}')
                    if target.suffix != ext:
                        target = target.rename(target.with_suffix(ext))
                    block['src'] = f'/restored-exams/{target.name}'
                    block['alt'] = f'{question["title"]} 문제 자료 {i + 1}'
                    block['source'] = block['source'].split('?')[0]
        # 이 그림은 게시자가 별도 외부 출처를 명시했습니다. 제3자 도안을 복제하지 않고 사실 관계를 표로 다시 구성합니다.
        cloud = next(e for e in exams if e['id'] == '2023-3')['questions'][16]
        cloud['blocks'] = [b for b in cloud['blocks'] if b['type'] != 'image']
        cloud['blocks'].insert(1, {'type': 'table', 'rows': [
            ['서비스 제공자가 관리하는 범위', '(1)', '(2)', '(3)'],
            ['가상화·서버·스토리지·네트워크', '제공자', '제공자', '제공자'],
            ['운영체제·미들웨어·런타임', '이용자', '제공자', '제공자'],
            ['데이터·애플리케이션', '이용자', '이용자', '제공자'],
        ]})
    output = ROOT / 'src' / 'data' / 'restoredExamsSource.json'
    output.write_text(json.dumps(exams, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for exam in exams:
        print(exam['id'], len(exam['questions']), '문항')
        for q in exam['questions']:
            if options.inspect:
                print(q['number'], ' | '.join(b.get('text', '[그림]' if b['type'] == 'image' else str(b.get('rows'))) for b in q['blocks'])[:180], '=>', ' | '.join(b.get('text', '[그림]') for b in q['answerBlocks'])[:150])


if __name__ == '__main__':
    main()
