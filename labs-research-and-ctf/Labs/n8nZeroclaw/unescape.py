import re

filepath = 'n8n-gcp-setup-guide + Zeroclaw.docx.md'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

def unescape(match):
    code = match.group(1)
    code = code.replace(r'\#', '#').replace(r'\-', '-').replace(r'\_', '_').replace(r'\[', '[').replace(r'\]', ']')
    return f"```bash\n{code}\n```"

content = re.sub(r'```bash\n(.*?)\n```', unescape, content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
