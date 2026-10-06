const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = fs.readdirSync(path.join(__dirname, 'src/features/m1_core/pages')).filter(f => f.endsWith('.tsx'));

for (const file of files) {
    const filePath = path.join(__dirname, 'src/features/m1_core/pages', file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace import
    content = content.replace(/import { apiClient } from '@\/utils\/apiClient'/g, "import { apiClient } from '@/api/client'");
    
    // Replace apiClient.get(url) -> apiClient(url)
    content = content.replace(/apiClient\.get\((.*?)\)/g, 'apiClient($1)');
    
    // Replace apiClient.post(url, data) -> apiClient(url, { data: data })
    content = content.replace(/apiClient\.post\(([^,]+),\s*([\s\S]*?)\)/g, 'apiClient($1, { data: $2 })');
    
    fs.writeFileSync(filePath, content, 'utf-8');
}
console.log('Done!');
