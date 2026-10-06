import os
import glob
import re

# Fix imports in Toast and Alert
for file_name in ['src/components/ui/Toast.tsx', 'src/components/ui/Alert.tsx']:
    with open(file_name, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("import { StatusFamily }", "import type { StatusFamily }")
    with open(file_name, 'w', encoding='utf-8') as f:
        f.write(content)

# Fix StatusPill props
files = glob.glob('src/features/m1_core/pages/*.tsx')
for file_name in files:
    with open(file_name, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # regex for <StatusPill status={...} variant={...} />
    # Also handle strings <StatusPill status="Active" variant="success" />
    
    # 1. status="..." variant="..." -> label="..." status="..."
    content = re.sub(
        r'<StatusPill\s+status=("[^"]+")\s+variant=("[^"]+")',
        r'<StatusPill label=\1 status=\2',
        content
    )
    
    # 2. status={...} variant={...} -> label={...} status={...}
    content = re.sub(
        r'<StatusPill\s+status=(\{[^}]+\})\s+variant=(\{[^}]+\})',
        r'<StatusPill label=\1 status=\2',
        content
    )
    
    # 3. status={status} variant={variant} (from TermManagementPage)
    content = re.sub(
        r'<StatusPill\s+status=\{status\}\s+variant=\{variant\}',
        r'<StatusPill label={status} status={variant}',
        content
    )
    
    with open(file_name, 'w', encoding='utf-8') as f:
        f.write(content)
print("Fixed StatusPill props and imports")
