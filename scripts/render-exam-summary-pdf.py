"""학습 카드의 요점과 공통 계산 데이터를 A4 복습용 PDF로 조판합니다."""
import argparse
import copy
import html
import hashlib
import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import BaseDocTemplate, Flowable, Frame, NextPageTemplate, PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle

parser = argparse.ArgumentParser()
parser.add_argument('--output', required=True)
parser.add_argument('--font', required=True)
parser.add_argument('--bold-font', required=True)
parser.add_argument('--date', required=True)
parser.add_argument('--atlas-output')
parser.add_argument('--manifest-output')
args = parser.parse_args()
data = json.load(sys.stdin)

regular = TTFont('Korean', args.font)
bold = TTFont('KoreanBold', args.bold_font)
pdfmetrics.registerFont(regular)
pdfmetrics.registerFont(bold)
pdfmetrics.registerFontFamily('Korean', normal='Korean', bold='KoreanBold', italic='Korean', boldItalic='KoreanBold')
PAGE_W, PAGE_H = A4
MARGIN, GAP = 32, 18
WIDTH = PAGE_W - MARGIN * 2
COL_W = (WIDTH - GAP) / 2
NAVY, BLUE, MUTED = colors.HexColor('#182a43'), colors.HexColor('#2563eb'), colors.HexColor('#52647c')
LINE, SOFT = colors.HexColor('#dae3ed'), colors.HexColor('#f2f6fb')
SUBJECT_COLORS = ['#2563eb', '#765dd6', '#118794', '#b56224', '#218354']
SUPERSCRIPTS = str.maketrans('⁰¹²³⁴⁵⁶⁷⁸⁹', '0123456789')


def clean(text):
    value = re.sub(r'[⁰¹²³⁴⁵⁶⁷⁸⁹]+', lambda m: '^' + m[0].translate(SUPERSCRIPTS), str(text))
    value = value.replace('ⁿ', '^n').replace('ˢ', '^s').replace('₂', '2').replace('⋈', 'JOIN')
    value = value.replace('⌊', 'floor(').replace('⌋', ')')
    value = value.replace('⌈', 'ceil(').replace('⌉', ')')
    value = re.sub('[−–—‑]', '-', value)
    missing = {c for c in value if not c.isspace() and ord(c) not in regular.face.charToGlyph}
    if missing:
        raise ValueError(f'지원되지 않는 글자: {sorted(missing)}')
    return value


styles = {
    'title': ParagraphStyle('title', fontName='KoreanBold', fontSize=19, leading=25, textColor=NAVY, spaceAfter=10, keepWithNext=True),
    'section': ParagraphStyle('section', fontName='KoreanBold', fontSize=15, leading=21, textColor=BLUE, spaceAfter=8, keepWithNext=True),
    'card': ParagraphStyle('card', fontName='KoreanBold', fontSize=10, leading=14, textColor=NAVY, spaceBefore=9, spaceAfter=4, keepWithNext=True),
    'memory': ParagraphStyle('memory', fontName='Korean', fontSize=8.4, leading=12, textColor=MUTED, spaceAfter=5, keepWithNext=True),
    'term': ParagraphStyle('term', fontName='KoreanBold', fontSize=8.4, leading=11.6, textColor=NAVY),
    'cell': ParagraphStyle('cell', fontName='Korean', fontSize=8.5, leading=12, textColor=NAVY),
    'head': ParagraphStyle('head', fontName='KoreanBold', fontSize=8.1, leading=11, textColor=BLUE),
    'note': ParagraphStyle('note', fontName='Korean', fontSize=8.1, leading=11.7, textColor=MUTED, spaceBefore=5, spaceAfter=5),
    'body': ParagraphStyle('body', fontName='Korean', fontSize=9.2, leading=14, textColor=NAVY, spaceAfter=8),
}
for style in styles.values():
    style.alignment = TA_LEFT
    style.splitLongWords = True


def p(text, style='cell'):
    return Paragraph(html.escape(clean(text)), styles[style])


def heading(text, key, level=0, style='section'):
    item = p(text, style)
    item.bookmark = (key, clean(text), level)
    return item


def table(columns, rows, widths, header_color=BLUE):
    cells = [[p(value, 'head') for value in columns]]
    cells.extend([[p(value, 'term' if index == 0 else 'cell') for index, value in enumerate(row)] for row in rows])
    result = Table(cells, colWidths=widths, repeatRows=1, hAlign='LEFT')
    result.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 5), ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('BACKGROUND', (0, 0), (-1, 0), SOFT),
        ('LINEBELOW', (0, 0), (-1, 0), .7, header_color),
        ('LINEBELOW', (0, 1), (-1, -1), .3, LINE),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fafbfd')]),
    ]))
    return result


def compact_terms(items, color):
    rows = [[Paragraph(f'<b>{html.escape(clean(item["name"]))}</b>  |  {html.escape(clean(item["summary"]))}', styles['cell'])] for item in items]
    result = Table(rows, colWidths=[COL_W], hAlign='LEFT')
    result.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6), ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 3), ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LINEBEFORE', (0, 0), (0, -1), 1.1, color),
        ('LINEBELOW', (0, 0), (-1, -1), .25, LINE),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#f7f9fc')]),
    ]))
    return result


class ReviewDoc(BaseDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark'):
            key, title, level = flowable.bookmark
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(title, key, level=level)


class NumberedCanvas(canvas.Canvas):
    total_pages = None

    def showPage(self):
        self.setStrokeColor(LINE)
        self.line(MARGIN, 29, PAGE_W - MARGIN, 29)
        self.setFont('Korean', 7.5)
        self.setFillColor(MUTED)
        self.drawString(MARGIN, 17, '정처기학습 플랫폼  |  시험 직전 복습')
        label = f'{self._pageNumber} / {self.total_pages}' if self.total_pages else str(self._pageNumber)
        self.drawRightString(PAGE_W - MARGIN, 17, label)
        super().showPage()


def page_header(canv, _doc):
    canv.saveState()
    canv.setFont('KoreanBold', 8)
    canv.setFillColor(NAVY)
    canv.drawString(MARGIN, PAGE_H - 23, '정보처리기사 실기 핵심 요약')
    canv.setFont('Korean', 7)
    canv.setFillColor(MUTED)
    canv.drawRightString(PAGE_W - MARGIN, PAGE_H - 23, f'자료 기준 {args.date}')
    canv.setStrokeColor(BLUE)
    canv.setLineWidth(.8)
    canv.line(MARGIN, PAGE_H - 29, PAGE_W - MARGIN, PAGE_H - 29)
    canv.restoreState()


class GanttChart(Flowable):
    def __init__(self, schedules):
        super().__init__()
        self.schedules = schedules
        self.width = WIDTH
        self.height = 34 * len(schedules) + 14

    def draw(self):
        c = self.canv
        palette = {'P1': colors.HexColor('#dceaff'), 'P2': colors.HexColor('#e8e1fa'), 'P3': colors.HexColor('#d7efe8')}
        x0, plot_w = 98, WIDTH - 104
        for index, item in enumerate(self.schedules):
            y = self.height - 28 - index * 34
            c.setFont('KoreanBold', 8)
            c.setFillColor(NAVY)
            c.drawString(0, y + 7, clean(item['name']))
            end_time = max(slot[2] for slot in item['slots'])
            for name, start, end in item['slots']:
                x = x0 + plot_w * start / end_time
                width = plot_w * (end - start) / end_time
                c.setFillColor(palette[name])
                c.setStrokeColor(colors.white)
                c.rect(x, y, width, 21, fill=1, stroke=1)
                c.setFillColor(NAVY)
                c.drawCentredString(x + width / 2, y + 7, name)
                c.setFont('Korean', 7)
                c.drawString(x, y - 10, str(start))
                c.setFont('KoreanBold', 8)
            c.setFont('Korean', 7)
            c.drawRightString(x0 + plot_w, y - 10, str(end_time))


output = Path(args.output)
output.parent.mkdir(parents=True, exist_ok=True)
doc = ReviewDoc(str(output), pagesize=A4, title=clean(data['title']), author='정처기학습 플랫폼', pageCompression=1)
frames = [Frame(MARGIN, 38, COL_W, PAGE_H - 78, id='left', leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0),
          Frame(MARGIN + COL_W + GAP, 38, COL_W, PAGE_H - 78, id='right', leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)]
wide_frame = Frame(MARGIN, 38, WIDTH, PAGE_H - 78, id='wide', leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
doc.addPageTemplates([PageTemplate(id='columns', frames=frames, onPage=page_header), PageTemplate(id='wide', frames=[wide_frame], onPage=page_header)])

story = []
card_count = sum(len(section['cards']) for section in data['sections'])
for section_index, section in enumerate(data['sections']):
    if section_index:
        story.append(PageBreak())
    else:
        story.extend([p('시험 직전 핵심 요약', 'title'), p(f'전체 {card_count}개 요약 자료를 5과목의 용어·비교 기준으로 압축했습니다. 왼쪽 열부터 읽고 오른쪽 열로 이어서 확인하세요. 마지막 두 장은 계산 공식과 예제입니다.', 'body')])
    color = colors.HexColor(SUBJECT_COLORS[section_index])
    story.append(heading(f'{section_index + 1:02d}  {section["title"]}', section['id']))
    for card_index, card in enumerate(section['cards']):
        story.append(heading(f'{card_index + 1:02d}  {card["title"]}', card['id'], level=1, style='card'))
        if card['title'] in ['응집도', '결합도', 'DB 설계 절차', 'OSI와 TCP/IP', '프리픽스 변환', '시간 지표 공식']:
            story.append(p(card['memory'], 'memory'))
        terms = compact_terms(card['items'], color)
        terms.keepWithNext = bool(card.get('caution'))
        story.append(terms)
        if card.get('caution'):
            story.append(p('구별: ' + card['caution'], 'note'))

calc = data['calculations']
story.extend([NextPageTemplate('wide'), PageBreak(), heading('06  계산 공식 - CPU 스케줄링', 'calculation-cpu'),
              p('완료 시각 C를 시간축에서 먼저 찾고, 도착 A와 실행 B를 빼서 반환·대기시간을 구합니다.', 'body'),
              p('반환 T = C - A   |   대기 W = T - B   |   응답 R = 첫 실행 - A', 'body'),
              table(['프로세스', '도착 A', '실행 B'], [[x['id'], x['arrival'], x['burst']] for x in calc['processes']], [WIDTH / 3] * 3),
              Spacer(1, 9), GanttChart(calc['schedules'])])

result_rows = []
for scenario in calc['schedules']:
    waits, turns = [], []
    for proc in calc['processes']:
        runs = [slot for slot in scenario['slots'] if slot[0] == proc['id']]
        completion = runs[-1][2]
        turns.append(completion - proc['arrival'])
        waits.append(completion - proc['arrival'] - proc['burst'])
    result_rows.append([scenario['name'], ' / '.join(map(str, waits)), f'{sum(waits) / len(waits):.2f}', f'{sum(turns) / len(turns):.2f}'])
story.append(table(['알고리즘', 'P1 / P2 / P3 대기 W', '평균 W', '평균 T'], result_rows, [115, 170, 120, WIDTH - 405]))
story.extend([p('시간 단위 ms. 반올림은 마지막 평균에서 합니다. CPU가 쉬는 구간도 시간축에 포함하세요.', 'note'),
              p('SJF·HRN은 비선점형입니다. SRTF는 새 작업이 더 짧으면 선점합니다. RR은 할당량만큼 실행하고 미완료 작업을 큐 뒤로 보냅니다.', 'body'),
              p('HRN 우선순위 = (대기시간 + 실행시간) / 실행시간. 시각 6에서 P2=8/3, P3=4이므로 P3를 먼저 선택합니다.', 'body'),
              p('동률·동시 도착 처리: SRTF 예제는 시각 3에 잔여시간이 같은 P2를 계속 실행합니다. RR 예제는 실행 중 도착한 작업을 먼저 큐에 넣고 미완료 작업을 마지막에 넣습니다.', 'note'),
              p('검산 예: SRTF에서 P1 완료=10 → 반환=10-0=10 → 대기=10-6=4. 전체 평균 대기=(4+0+1)/3=1.67ms.', 'body'),
              PageBreak(), heading('07  계산 공식 - 서브넷과 페이지 교체', 'calculation-network'),
              p('호스트 비트 h = 32 - 프리픽스   |   전체 주소 = 2^h   |   일반적인 호스트 수 = 2^h - 2', 'body'),
              p('블록 크기 = 256 - 변화 옥텟의 마스크. 해당 IP가 들어가는 블록의 시작은 네트워크, 끝은 브로드캐스트입니다.', 'body'),
              table(['입력 / 마스크', '네트워크', '브로드캐스트', '사용 가능한 주소'],
                    [[x['input'] + '\n' + x['mask'], x['network'], x['broadcast'], x['usable']] for x in calc['subnetAddressExamples']], [128, 120, 120, WIDTH - 368]),
              p('77/26: 블록 64 → 64~127 → 네트워크 .64, 브로드캐스트 .127. 9/22: 세 번째 옥텟 블록 4 → 8~11 → 네트워크 172.16.8.0, 브로드캐스트 172.16.11.255.', 'note'),
              p('같은 크기 2^n개로 분할: 기존 프리픽스에 n을 더합니다. /27을 2분할하면 /28, 블록 16주소, 일반 호스트 14개입니다.', 'body'),
              table(['10.20.4.64/27을 2분할', '브로드캐스트', '사용 가능 범위'], calc['splitSubnets'], [150, 130, WIDTH - 280]),
              p('10.20.4.82는 둘째 블록 80~95에 포함됩니다. 정답: /28, 브로드캐스트 10.20.4.95.', 'body'),
              p('주소 검산: 네트워크는 IP AND 마스크. 브로드캐스트는 호스트 비트를 모두 1로 합니다. /31 점대점 링크에는 일반적인 2^h-2 공식을 적용하지 않습니다.', 'note'),
              p('페이지 부재 예제 - 빈 프레임 3개, 참조 순서 1 2 3 1 4 2 5', 'card'),
              table(['방식 / 참조', '1', '2', '3', '1', '4', '2', '5'],
                    [['FIFO 프레임', '1/-/-', '1/2/-', '1/2/3', '1/2/3', '4/2/3', '4/2/3', '4/5/3'],
                     ['FIFO 부재', 'O', 'O', 'O', '-', 'O', '-', 'O'],
                     ['LRU 프레임', '1/-/-', '1/2/-', '1/2/3', '1/2/3', '1/4/3', '1/4/2', '5/4/2'],
                     ['LRU 부재', 'O', 'O', 'O', '-', 'O', 'O', 'O']], [80] + [(WIDTH - 80) / 7] * 7),
              p('초기 적재도 부재에 포함: FIFO 5회, LRU 6회. FIFO는 적재 순서, LRU는 최근 사용 시점을 기준으로 교체합니다.', 'note')])

second_pass = copy.deepcopy(story)
doc.build(story, canvasmaker=NumberedCanvas)
NumberedCanvas.total_pages = len(PdfReader(str(output)).pages)
doc.build(second_pass, canvasmaker=NumberedCanvas)
reader = PdfReader(str(output))
extracted = ''.join(page.extract_text() or '' for page in reader.pages)
normalized = re.sub(r'\s+', '', extracted)
missing = [item['name'] for section in data['sections'] for card in section['cards'] for item in card['items'] if re.sub(r'\s+', '', clean(item['name'])) not in normalized]
if missing:
    raise ValueError(f'PDF에서 찾을 수 없는 용어: {missing}')
for destination in reader.outline:
    if isinstance(destination, list):
        continue
    page = reader.get_destination_page_number(destination)
    if page is None or re.sub(r'\s+', '', destination.title) not in re.sub(r'\s+', '', reader.pages[page].extract_text() or ''):
        raise ValueError(f'책갈피 페이지가 올바르지 않습니다: {destination.title}')
print(json.dumps({'pages': len(reader.pages), 'cards': sum(len(s['cards']) for s in data['sections']), 'terms': sum(len(c['items']) for s in data['sections'] for c in s['cards']), 'output': str(output)}, ensure_ascii=False))

# 각 카드만 담은 조판 조각을 만들어 브라우저에서 개인 순서대로 재배치합니다.
if args.atlas_output:
    atlas_output = Path(args.atlas_output)
    atlas_output.parent.mkdir(parents=True, exist_ok=True)
    atlas = canvas.Canvas(str(atlas_output), pageCompression=1, invariant=1)
    manifest = {'version': 1, 'date': args.date, 'layout': {'pageWidth': PAGE_W, 'pageHeight': PAGE_H, 'margin': MARGIN, 'columnWidth': COL_W, 'gap': GAP, 'bodyTop': PAGE_H - 47, 'bodyBottom': 38}, 'cards': {}, 'guides': {}}
    fragment_count = 0

    def fragment(flowables, width):
        global fragment_count
        sizes = [item.wrap(width, 10000)[1] for item in flowables]
        height = sum(size + item.getSpaceBefore() + item.getSpaceAfter() for item, size in zip(flowables, sizes)) + 8
        if height > PAGE_H - 85:
            raise ValueError('PDF 조각이 한 페이지보다 큽니다. 내용을 나누어 주세요.')
        atlas.setPageSize((width, height))
        y = height - 4
        for item, size in zip(flowables, sizes):
            y -= item.getSpaceBefore() + size
            item.drawOn(atlas, 0, y)
            y -= item.getSpaceAfter()
        atlas.showPage()
        result = {'page': fragment_count, 'width': width, 'height': height}
        fragment_count += 1
        return result

    atlas.setPageSize((WIDTH, 24))
    atlas.setFont('KoreanBold', 8)
    atlas.setFillColor(NAVY)
    atlas.drawString(0, 12, '정보처리기사 실기 - 내 실기 요약')
    atlas.setFont('Korean', 7)
    atlas.setFillColor(MUTED)
    atlas.drawRightString(WIDTH, 12, f'자료 기준 {args.date}')
    atlas.setStrokeColor(BLUE)
    atlas.line(0, 5, WIDTH, 5)
    atlas.showPage()
    manifest['header'] = {'page': 0, 'width': WIDTH, 'height': 24}
    fragment_count += 1
    atlas.setPageSize((WIDTH, 17))
    atlas.setStrokeColor(LINE)
    atlas.line(0, 16, WIDTH, 16)
    atlas.setFont('Korean', 7.5)
    atlas.setFillColor(MUTED)
    atlas.drawString(0, 4, '정처기학습 플랫폼  |  시험 직전 복습')
    atlas.showPage()
    manifest['footer'] = {'page': 1, 'width': WIDTH, 'height': 17}
    fragment_count += 1
    manifest['intro'] = fragment([p('내 실기 요약 - 시험 직전 핵심', 'title'), p('다운로드할 때 내 목록에 남아 있는 카드만 개인 순서대로 담았습니다. 왼쪽 열부터 읽고 오른쪽 열로 이어 확인하세요. 계산 예제는 남아 있는 관련 카드에 맞춰 마지막에 모았습니다.', 'body')], WIDTH)

    for section_index, section in enumerate(data.get('atlasSections', data['sections'])):
        color = colors.HexColor(SUBJECT_COLORS[section_index])
        for card in section['cards']:
            label_style = ParagraphStyle('subject-label', parent=styles['head'], textColor=color)
            flows = [Paragraph(html.escape(clean(section['title'])), label_style), p(card['title'], 'card')]
            if card['title'] in ['응집도', '결합도', 'DB 설계 절차', 'OSI와 TCP/IP', '프리픽스 변환', '시간 지표 공식']:
                flows.append(p(card['memory'], 'memory'))
            flows.append(compact_terms(card['items'], color))
            if card.get('caution'):
                flows.append(p('구별: ' + card['caution'], 'note'))
            manifest['cards'][card['id']] = {**fragment(flows, COL_W), 'title': card['title'], 'subject': section['title'], 'signature': json.dumps(card, ensure_ascii=False, separators=(',', ':'))}

    def cpu_example(scenarios):
        rows = []
        for scenario in scenarios:
            waits, turns = [], []
            for proc in calc['processes']:
                runs = [slot for slot in scenario['slots'] if slot[0] == proc['id']]
                completion = runs[-1][2]
                turns.append(completion - proc['arrival'])
                waits.append(completion - proc['arrival'] - proc['burst'])
            rows.append([scenario['name'], ' / '.join(map(str, waits)), f'{sum(waits) / len(waits):.2f}', f'{sum(turns) / len(turns):.2f}'])
        return [p('계산 예제 - CPU 스케줄링', 'section'),
                p('반환 T = 완료 C - 도착 A   |   대기 W = T - 실행 B   |   응답 R = 첫 실행 - A', 'body'),
                table(['프로세스', '도착 A', '실행 B'], [[x['id'], x['arrival'], x['burst']] for x in calc['processes']], [WIDTH / 3] * 3),
                Spacer(1, 10), GanttChart(scenarios),
                table(['알고리즘', 'P1 / P2 / P3 대기 W', '평균 W', '평균 T'], rows, [115, 170, 120, WIDTH - 405]),
                p('시간 단위 ms. 완료 시각은 해당 프로세스의 마지막 실행 끝이며, 대기시간에는 CPU에서 실행한 시간을 포함하지 않습니다.', 'note'),
                *[p(scenario['name'] + ': ' + scenario['note'], 'note') for scenario in scenarios]]

    for guide_id, scenarios in [('cpu-all', calc['schedules']), ('cpu-nonpreemptive', calc['schedules'][:3]), ('cpu-preemptive', calc['schedules'][3:])]:
        manifest['guides'][guide_id] = {**fragment(cpu_example(scenarios), WIDTH), 'title': '계산 예제 - CPU 스케줄링'}
    manifest['guides']['subnet-address'] = {**fragment([
        p('계산 예제 - 네트워크·브로드캐스트 주소', 'section'),
        p('호스트 비트 h = 32 - 프리픽스   |   전체 주소 = 2^h   |   일반적인 호스트 수 = 2^h - 2', 'body'),
        p('블록 크기 = 256 - 변화 옥텟의 마스크. IP가 들어가는 블록의 시작은 네트워크, 끝은 브로드캐스트입니다.', 'body'),
        table(['입력 / 마스크', '네트워크', '브로드캐스트', '사용 가능한 주소'], [[x['input'] + '\n' + x['mask'], x['network'], x['broadcast'], x['usable']] for x in calc['subnetAddressExamples']], [128, 120, 120, WIDTH - 368]),
        p('77/26: 블록 64 → 64~127 → 네트워크 .64, 브로드캐스트 .127. 9/22: 세 번째 옥텟 블록 4 → 8~11 → 네트워크 172.16.8.0, 브로드캐스트 172.16.11.255.', 'note'),
        p('주소 검산: 네트워크는 IP AND 마스크. 브로드캐스트는 호스트 비트를 모두 1로 합니다. /31 점대점 링크에는 일반적인 2^h-2 공식을 적용하지 않습니다.', 'note')], WIDTH), 'title': '계산 예제 - 네트워크·브로드캐스트 주소'}
    manifest['guides']['subnet-split'] = {**fragment([
        p('계산 예제 - 서브넷 분할', 'section'),
        p('같은 크기 2^n개로 분할: 기존 프리픽스에 n을 더합니다. /27을 2분할하면 /28, 블록 16주소, 일반 호스트 14개입니다.', 'body'),
        table(['10.20.4.64/27을 2분할', '브로드캐스트', '사용 가능 범위'], calc['splitSubnets'], [150, 130, WIDTH - 280]),
        p('10.20.4.82는 둘째 블록 80~95에 포함됩니다. 정답: /28, 브로드캐스트 10.20.4.95.', 'note')], WIDTH), 'title': '계산 예제 - 서브넷 분할'}
    manifest['guides']['page-replacement'] = {**fragment([
        p('계산 예제 - 페이지 교체', 'section'), p('빈 프레임 3개, 참조 순서 1 2 3 1 4 2 5', 'body'),
        table(['방식 / 참조', '1', '2', '3', '1', '4', '2', '5'], [['FIFO 프레임', '1/-/-', '1/2/-', '1/2/3', '1/2/3', '4/2/3', '4/2/3', '4/5/3'], ['FIFO 부재', 'O', 'O', 'O', '-', 'O', '-', 'O'], ['LRU 프레임', '1/-/-', '1/2/-', '1/2/3', '1/2/3', '1/4/3', '1/4/2', '5/4/2'], ['LRU 부재', 'O', 'O', 'O', '-', 'O', 'O', 'O']], [80] + [(WIDTH - 80) / 7] * 7),
        p('초기 적재도 부재에 포함: FIFO 5회, LRU 6회. FIFO는 적재 순서, LRU는 최근 사용 시점을 기준으로 교체합니다.', 'note')], WIDTH), 'title': '계산 예제 - 페이지 교체'}
    atlas.save()
    atlas_reader = PdfReader(str(atlas_output))
    for card_id, entry in manifest['cards'].items():
        text = re.sub(r'\s+', '', atlas_reader.pages[entry['page']].extract_text() or '')
        card = json.loads(entry['signature'])
        if any(re.sub(r'\s+', '', clean(item['name'])) not in text for item in card['items']):
            raise ValueError(f'개인 PDF 조각에 누락된 용어가 있습니다: {card_id}')
    manifest['sha256'] = hashlib.sha256(atlas_output.read_bytes()).hexdigest()
    Path(args.manifest_output).write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(json.dumps({'atlasPages': fragment_count, 'atlasCards': len(manifest['cards']), 'atlas': str(atlas_output)}, ensure_ascii=False))
