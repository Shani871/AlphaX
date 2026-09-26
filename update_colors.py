import os

replacements = {
    '#5B7FFF': '#7FFFD4',
    '#0B0C0E': '#000000',
    '#141619': '#050505',
    '#1C1F24': '#0A0A0A',
    '?"': '—',
    '?': '—'
}

for root, dirs, files in os.walk('UI/src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            new_content = content
            for k, v in replacements.items():
                new_content = new_content.replace(k, v)
                
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
print('Colors updated successfully.')
