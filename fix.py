import os

path = 'UI/src/components/features/GeminiLiveView.tsx'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

text = text.replace('listening\xef\xbf\xbd?"feel', 'listening—feel')
text = text.replace('listening?"feel', 'listening—feel')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

path = 'UI/src/App.tsx'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

text = text.replace('activeFeature === \'gemini_live\' ?" (', 'activeFeature === \'gemini_live\' ? (')
text = text.replace('activeFeature === \'transcript_select\' ?" (', 'activeFeature === \'transcript_select\' ? (')
text = text.replace('activeFeature === \'translate\' ?" (', 'activeFeature === \'translate\' ? (')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print('Fixed')
