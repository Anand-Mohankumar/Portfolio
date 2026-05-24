import re
import os

filepath = 'n8n-gcp-setup-guide + Zeroclaw.docx.md'

with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace single cell table code blocks
def fix_code_block(match):
    content = match.group(1).strip()
    
    # Do not replace warning / note / success boxes
    if content.startswith(('ℹ', '✖', '⚠', '✔', '💡', 'Phase', 'PHASE')):
        return match.group(0)

    # If it has more than one | inside, it was a multi-column table mistakenly joined?
    # Actually wait, `echo ... | sudo tee ...` has a pipe. We need to handle it.
    
    # Replace common commands with newlines before them
    if 'sudo ' in content or '#' in content or 'docker ' in content:
        content = re.sub(r' (sudo )', r'\n\1', content)
        content = re.sub(r' (docker )', r'\n\1', content)
        content = re.sub(r' (\\# )', r'\n\1', content)
        content = re.sub(r' (# )', r'\n\1', content)
        content = re.sub(r' (mkdir )', r'\n\1', content)
        content = re.sub(r' (groups )', r'\n\1', content)
        content = re.sub(r' (nano )', r'\n\1', content)
        content = re.sub(r' (curl )', r'\n\1', content)
        
    # Special cases:
    if 'server {' in content:
        # Format nginx config
        content = content.replace(' server {', '\nserver {')
        content = content.replace('     ', '\n    ')
        content = content.replace('; ', ';\n    ')
        content = content.replace('} ', '}\n')
    elif 'services:' in content:
        # Format docker-compose
        content = content.replace('   ', '\n  ')
        content = content.replace('     ', '\n    ')
        content = content.replace('       ', '\n      ')
    elif '[sshd]' in content:
        content = content.replace(' enabled', '\nenabled').replace(' port', '\nport').replace(' maxretry', '\nmaxretry').replace(' bantime', '\nbantime').replace(' findtime', '\nfindtime')
    elif 'Status: active' in content:
        content = content.replace(' To ', '\nTo ').replace(' \-- ', '\n\-- ').replace(' 22/tcp ', '\n22/tcp ').replace(' 80/tcp ', '\n80/tcp ').replace(' 443/tcp ', '\n443/tcp ')
    elif 'NAME   IMAGE' in content:
        content = content.replace(' n8n ', '\nn8n ')
    elif 'Successfully received certificate.' in content:
        content = content.replace(' Certificate is', '\nCertificate is').replace(' Congratulations', '\nCongratulations')
    elif 'nginx: the configuration file' in content:
        content = content.replace(' nginx: configuration', '\nnginx: configuration')

    return f"```bash\n{content}\n```"

# Match exactly | content | \n | :---- | (and possibly | content | content | \n | :---- | :---- | which we DO NOT WANT)
# So we only match if there's exactly one :----
pattern = r'^\| (.*?) \|\n\| :----\s*\|$'
text = re.sub(pattern, fix_code_block, text, flags=re.MULTILINE)

# Also fix the weird docker repository one which got split into two cells
pattern_docker = r'^\| (echo.*?docker\.gpg\] .*?) \| (sudo tee .*?) \|\n\| :----\s*\|$'
def fix_docker(match):
    return f"```bash\n{match.group(1)} | {match.group(2)}\n```"
text = re.sub(pattern_docker, fix_docker, text, flags=re.MULTILINE)

# Also fix the apt keyrings one
pattern_keyrings = r'^\| (sudo install \-m 0755 .*? ubuntu/gpg) \| (sudo gpg .*?) \|\n\| :----\s*\|$'
def fix_keyrings(match):
    return f"```bash\n{match.group(1)} | {match.group(2)}\n```"
text = re.sub(pattern_keyrings, fix_keyrings, text, flags=re.MULTILINE)

# Now, we should also fix the swap line which is another two-cell one
pattern_swap = r'^\| (.*? /etc/fstab) \| (.*? free \\-h) \|\n\| :----\s*\|$'
def fix_swap(match):
    c = f"{match.group(1)} | {match.group(2)}"
    c = re.sub(r' (sudo )', r'\n\1', c)
    c = re.sub(r' (\\# )', r'\n\1', c)
    return f"```bash\n{c}\n```"
text = re.sub(pattern_swap, fix_swap, text, flags=re.MULTILINE)


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)

print("Formatting applied.")
