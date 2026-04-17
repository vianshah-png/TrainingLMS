import sys

path = r"c:\Users\Admin\Desktop\MouseWithoutBorders\lms for mentors (2)\lms for mentors\lms-platform\src\components\TopicCard.tsx"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "971:" in str(i+1) or ") : (" in line and "grid-cols-1 sm:grid-cols-2 gap-4" in lines[i+1]:
        # This is where we want to start replacing
        new_lines.append(line.replace(') : (', ') : (')) # Keep the line but we'll modify it
        new_lines.append(lines[i+1].replace('grid-cols-1 sm:grid-cols-2 gap-4', 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8'))
        # We need to skip the old map logic and insert the new one
        # But wait, it's easier to just replace the whole block in python
        pass

# Actually, let's just do a string replace on the whole content
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """                                     ) : (
                                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">"""

# Let's be even more flexible with whitespace
import re
pattern = r'\) : \(\s*\n\s*<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">'
replacement = ') : (\n                                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">'

content = re.sub(pattern, replacement, content)

# Now handle the map part
# Since it's complex, I'll just replace the lines 972 to 1042 roughly
# But I'll try to find the start and end tokens

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
