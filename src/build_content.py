"""Builds content.json for the Delivered game from the Interview Script Book (read-only source)."""
import re, json, sys
BOOK = '/mnt/project-files/qualgo-interview/Qualgo_Lead_Product_Designer_Interview_Script_Book.md'
s = open(BOOK, encoding='utf8').read()

def section(start, end):
    a = s.index(start); b = s.index(end, a + len(start)); return s[a:b]

def clean(t):
    t = t.strip()
    t = re.sub(r'\n{3,}', '\n\n', t)
    return t

LABELS = ['Ai hỏi / chấm gì.', 'Hiểu câu hỏi.', 'Vì sao câu trả lời này hiệu quả.', 'Vì sao cách tiếp cận này hiệu quả.',
          'Để đạt 5/5.', 'Bằng chứng và trạng thái.', 'Bộ nhớ.', 'Câu hỏi đào sâu.', 'Bẫy cần tránh.']
ANS = re.compile(r'^\*\*(Câu trả lời mẫu[^*]*|Câu hỏi mẫu[^*]*)\*\*(.*)$', re.M)

def parse_q(bl):
    head = bl.split('\n', 1)[0]
    m = re.match(r'### Q(\d+) · Phòng (\w) ·(.*)', head)
    n, room, rest = int(m.group(1)), m.group(2), m.group(3)
    top = 'TOP' in rest
    diff = rest.split('Mức độ')[-1].count('★')
    qm = re.search(r'^> \*\*"?(.+?)"?\*\*\s*$', bl, re.M)
    q = qm.group(1).strip().strip('"“”')
    # locate labels
    marks = []
    for lab in LABELS:
        for mm in re.finditer(r'^\*\*' + re.escape(lab) + r'\*\*', bl, re.M):
            marks.append((mm.start(), mm.end(), lab))
    for mm in ANS.finditer(bl):
        marks.append((mm.start(), mm.start() + len('**' + mm.group(1) + '**'), 'ANSWER:' + mm.group(1)))
    marks.sort()
    out = {}
    for i, (st, en, lab) in enumerate(marks):
        nxt = marks[i + 1][0] if i + 1 < len(marks) else len(bl)
        out[lab] = bl[en:nxt]
    ans_key = [k for k in out if k.startswith('ANSWER:')]
    answer = clean(out[ans_key[0]]) if ans_key else ''
    answer_label = ans_key[0][7:] if ans_key else ''
    answer = re.sub(r'\n---\s*$', '', answer).strip()
    mem = out.get('Bộ nhớ.', '')
    def row(name):
        r = re.search(r'^\| \*\*' + re.escape(name) + r'\*\* \| (.*?) \|\s*$', mem, re.M)
        return r.group(1).strip() if r else ''
    fu_txt = out.get('Câu hỏi đào sâu.', '')
    fus = []
    for line in fu_txt.strip().split('\n'):
        line = line.strip()
        if not line.startswith('- '): continue
        line = line[2:]
        mm = re.match(r'\*"?(.+?)"?\*\s*→\s*(.*)', line)
        if mm: fus.append({'q': mm.group(1).strip('"“” '), 'a': mm.group(2).strip()})
        else: fus.append({'q': line, 'a': ''})
    traps = clean(out.get('Bẫy cần tránh.', '')).split('\n---')[0].strip()
    why = clean(out.get('Vì sao câu trả lời này hiệu quả.', '') or out.get('Vì sao cách tiếp cận này hiệu quả.', ''))
    opener_m = re.search(r'\*\*"(.+?)"\*\*', answer)
    return dict(n=n, room=room, top=top, diff=diff, q=q,
                who=clean(out.get('Ai hỏi / chấm gì.', '')), understand=clean(out.get('Hiểu câu hỏi.', '')),
                answer_label=answer_label, answer=answer, opener=opener_m.group(1) if opener_m else '',
                why=why, five=clean(out.get('Để đạt 5/5.', '')), evidence=clean(out.get('Bằng chứng và trạng thái.', '')),
                hook=row('Móc nhớ'), image=row('Hình dung'), locus=row('Vị trí'), must=row('Bắt buộc phải nói'),
                drill=row('Bài luyện'), follow_ups=fus, traps=traps)

qs = section('### Q1 ·', '# Phần 11.')
blocks = [b for b in re.split(r'^(?=### Q\d+ ·)', qs, flags=re.M) if b.startswith('### Q')]
cards = [parse_q(b) for b in blocks]
assert len(cards) == 72, len(cards)
for c in cards:
    for k in ('q', 'answer', 'opener', 'hook', 'image', 'must', 'five'):
        if not c[k]: print('MISSING', c['n'], k, file=sys.stderr)

# Quickfire
qf = []
for line in section('# Phần 11.', '# Phần 12.').split('\n'):
    cells = [c.strip() for c in line.strip().strip('|').split('|')]
    if len(cells) == 4 and re.match(r'QF\d+$', cells[0]):
        qf.append(dict(n=int(cells[0][2:]), q=cells[1], a=cells[2], note=cells[3]))
assert len(qf) == 30

# Truth table
truth = []
for line in section('## 7.6', '# Phần 8.').split('\n'):
    m = re.match(r'^\| (T\d+) \| (.*?) \| (.*?) \| (.*?) \| (.*?) \|\s*$', line)
    if m: truth.append(dict(id=m.group(1), claim=m.group(2), status=m.group(3), ask=m.group(4), todo=m.group(5)))
assert len(truth) == 17

# Numbers
nums = []
for line in section('## 7.5', '## 7.6').split('\n'):
    m = re.match(r'^\| \*\*(.+?)\*\* \| (.*?) \| (.*?) \|\s*$', line)
    if m: nums.append(dict(n=m.group(1), what=m.group(2), use=m.group(3)))
corridor = re.search(r'\*\*Mẹo nhớ: "Hành lang các con số".\*\*(.*)', section('## 7.5', '## 7.6')).group(1).strip()

# Blind spots
blind = []
for m in re.finditer(r'^### (B\d+)\. (.+?)\n\*Họ thấy[^*]*\*:?(.*?)\n\*Sửa:\*(.*?)(?=\n### B|\n---)', section('# Phần 6.', '# Phần 7.'), re.M | re.S):
    blind.append(dict(id=m.group(1), title=m.group(2).strip(), see=m.group(3).strip(), fix=m.group(4).strip()))

# Scorecard
score = []
for line in section('## 5.2', '## 5.3').split('\n'):
    cells = [c.strip() for c in line.strip().strip('|').split('|')]
    if len(cells) == 9 and cells[0].isdigit():
        score.append(dict(row=int(cells[0]), name=cells[1].replace('**', ''), weight=cells[2].replace('**', ''), today=cells[3].replace('**', ''),
                          proof=cells[6], qs=cells[7], artefacts=cells[8], star='\\*' in cells[5] or '*' in cells[5].replace('**', '')))
assert len(score) == 21

# Proof sprint
proof = []
for line in section('## 8.8', '# Phần 9.').split('\n'):
    cells = [c.strip() for c in line.strip().strip('|').split('|')]
    if len(cells) == 6 and re.match(r'\*\*P\d', cells[0]):
        proof.append(dict(id=cells[0].replace('*', ''), what=cells[1], time=cells[2], rows=cells[3], done=cells[4], say=cells[5]))
assert len(proof) == 8, proof

# Schedule
sched = []
for line in section('## 14.2', '## 14.3').split('\n'):
    cells = [c.strip() for c in line.strip().strip('|').split('|')]
    if len(cells) == 6 and re.match(r'\*\*\d+\*\*', cells[0]):
        sched.append(dict(day=int(cells[0].strip('*')), theme=cells[1], new=cells[2], review=cells[3], read=cells[4], task=cells[5]))
assert len(sched) == 14

def expand(t):
    ids = []
    for a, b in re.findall(r'Q(\d+)(?:[–-]Q?(\d+))?', t):
        a = int(a); b = int(b) if b else a
        ids += list(range(a, b + 1))
    return ids
for d in sched: d['new_ids'] = expand(d['new']); d['review_ids'] = expand(d['review'])
for r in score:
    r['q_ids'] = expand(r['qs']); r['p_ids'] = re.findall(r'P\d', r['artefacts'])

honesty = [
 "I haven't shipped a consumer chat app. What I have shipped is products people must trust with their money and their security, and that's the harder half of a privacy-first chat product.",
 "That's measured, here's how. And here's the part I'd want to measure better.",
 "I don't know yet. Here's how I'd find out in a week.",
 "I've hired and led a team of three, and I've coached 50-plus designers. I haven't run a team of ten yet, and I'd say so on day one."]

wb = {}
for key, start, end in [('strangers', '## 12.2', '## 12.3'), ('community', '## 12.3', '## 12.4'), ('linking', '## 12.4', '## 12.5')]:
    t = section(start, end)
    brief = re.search(r'\*"(.+?)"\*', t).group(1)
    wb[key] = dict(brief=brief, model=clean(t.split('\n', 1)[1]))
cupsf = clean(section('## 12.1', '## 12.2').split('\n', 1)[1])
rubric = clean(section('## 4.4', '---\n\n# Phần 5').split('\n', 1)[1])
oneliner = '"I design products people have to trust with something that matters: their money, their security, their data. And I make the teams around me faster and better at it."'
story30 = re.search(r'## 7.2 Phiên bản 30 giây\n\*"(.+?)"\*', s, re.S).group(1)
sig = clean(section('## 7.4', '## 7.5').split('\n', 1)[1])
compress = clean(section('## 14.4', '## 14.5').split('\n', 1)[1])
portfolio45 = clean(section('## 8.6', '## 8.7').split('\n', 1)[1])

json.dump(dict(cards=cards, quickfire=qf, truth=truth, numbers=nums, corridor=corridor, blind=blind, scorecard=score, proof=proof,
               schedule=sched, honesty=honesty, whiteboard=wb, cupsf=cupsf, rubric=rubric, oneliner=oneliner, story30=story30,
               signature=sig, compress=compress, portfolio45=portfolio45),
          open('/mnt/project-files/qualgo-game/src/content.json', 'w', encoding='utf8'), ensure_ascii=False)
print('ok', len(cards), len(qf), len(truth), len(nums), len(blind), len(score), len(proof), len(sched))
