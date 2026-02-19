
import os

file_path = r'c:\Users\DESIGNER ADMIN\Videos\Open Innovation Kavach\OpenI\ConstructIQ\frontend\src\App.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix specific typos
content = content.replace('/api/generate - plan', '/api/generate-plan')
content = content.replace('/api/generate - parametric - plan', '/api/generate-parametric-plan')
content = content.replace('/api/sketch / analyze', '/api/sketch/analyze')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed endpoints in App.jsx")
