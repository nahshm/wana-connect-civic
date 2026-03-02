from pypdf import PdfReader
r = PdfReader(r'E:\WANA_antigravity\wana-connect-civic\r_new\The Architecture of the Kenyan State.pdf')
print(f'Total pages: {len(r.pages)}')
for i, p in enumerate(r.pages):
    t = p.extract_text()
    if t and t.strip():
        print(f'=== PAGE {i+1} ===')
        print(t[:4000])
