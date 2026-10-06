import glob
import re

files = glob.glob('src/features/m1_core/pages/*.tsx')
for file_name in files:
    with open(file_name, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # regex for action={{ label: '...', onClick: () => ... }}
    # using non-greedy match for the label and onClick
    content = re.sub(
        r"action=\{\{\s*label:\s*'([^']+)',\s*onClick:\s*([^\}]+)\s*\}\}",
        r'action={<Button variant="primary" onClick={\2}>\1</Button>}',
        content
    )
    
    with open(file_name, 'w', encoding='utf-8') as f:
        f.write(content)

print("Fixed action prop in EmptyState")
