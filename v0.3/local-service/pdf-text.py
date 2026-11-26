import sys, io
from pypdf import PdfReader
sys.stdout.reconfigure(encoding='utf-8')
reader = PdfReader(io.BytesIO(sys.stdin.buffer.read()))
total = 0
for number, page in enumerate(reader.pages[:150], 1):
    text = page.extract_text() or ''
    print(f'\n[PDF page {number}]\n{text}')
    total += len(text)
    if total > 120000:
        break
