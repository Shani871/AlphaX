import os

path = 'UI/src/components/layout/AssistantHomeScreen.tsx'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

text = text.replace('=== \'home\' —', '=== \'home\' ?')
text = text.replace('=== \'gemini_live\' —', '=== \'gemini_live\' ?')
text = text.replace('=== \'transcript_select\' —', '=== \'transcript_select\' ?')
text = text.replace('=== \'translate\' —', '=== \'translate\' ?')
text = text.replace('— (', '? (')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

path = 'UI/src/App.tsx'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()
text = text.replace('=== \'gemini_live\' —', '=== \'gemini_live\' ?')
text = text.replace('=== \'transcript_select\' —', '=== \'transcript_select\' ?')
text = text.replace('=== \'translate\' —', '=== \'translate\' ?')
text = text.replace('— (', '? (')
with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print('Fixed ternary')
