
import re
import os

file_path = r'c:\Users\DESIGNER ADMIN\Videos\Open Innovation Kavach\OpenI\ConstructIQ\frontend\src\App.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the import
if 'import { API_BASE_URL }' not in content:
    content = content.replace("import axios from 'axios'", "import axios from 'axios'\nimport { API_BASE_URL } from './config';")

# Fix the axios calls
# The pattern effectively matches: axios.post(' [ ... ] /api/endpoint',
# We want to replace it with: axios.post(`${API_BASE_URL}/api/endpoint`,

# Regex explain:
# axios\.post\('\[          Match start
# (?:.|[\r\n])*?           Match anything (non-greedy, including newlines)
# \]                       Match closing bracket of JSON
# (/api/[^']*)'            Match the endpoint (e.g. /api/generate-plan) and capture it, until the closing quote
# ,                        Match the comma

new_content = re.sub(
    r"axios\.post\('\[(?:.|[\r\n])*?\](/api/[^']*)',",
    r"axios.post(`${API_BASE_URL}\1`,",
    content
)

# Also fix the spacing issues if any (e.g. /api/generate - plan)
# The view_file output showed spaces in the endpoint string sometimes?
# "]/api/generate - plan', {"
# If so, the regex above `[^']*` will capture them.
# We can do a second pass to clean up spaces in the endpoint if needed.
# But looking at the regex replacement I used in the tool call, the keys were:
# "http://localhost:8000/api/generate-parametric-plan"
# So the endpoint should be clean in the key.
# However, the `startLine` in the JSON had spaces in the Key? No.
# let's just run the regex and then check.

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Fixed App.jsx")
