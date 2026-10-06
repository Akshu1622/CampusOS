import os
import glob
import re

files = glob.glob('src/features/m1_core/pages/*.tsx')
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Replace import
    content = content.replace("import { apiClient } from '@/utils/apiClient'", "import { apiClient } from '@/api/client'")
    
    # Replace apiClient.get(url) -> apiClient(url)
    content = re.sub(r'apiClient\.get\((.*?)\)', r'apiClient(\1)', content)
    
    # Replace apiClient.post(url, data) -> apiClient(url, { data: data })
    content = re.sub(r'apiClient\.post\(([^,]+),\s*([\s\S]*?)\)', r'apiClient(\1, { data: \2 })', content)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
print('Done!')
