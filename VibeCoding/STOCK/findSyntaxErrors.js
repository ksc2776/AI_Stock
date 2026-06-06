const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.js') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('.');
let found = 0;
files.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split('\n');
    let modified = false;
    lines.forEach((line, i) => {
        if (line.includes('를 ') || line.includes('률 ')) {
            console.log(`[${f}:${i + 1}] ${line.trim()}`);
            
            // Auto-fix if it looks like a broken ternary
            if (line.match(/를|률/)) {
                lines[i] = line.replace(/ (를|률) /, ' ? ');
                modified = true;
                found++;
            }
        }
    });
    
    if (modified) {
        fs.writeFileSync(f, lines.join('\n'));
        console.log(`=> FIXED: ${f}`);
    }
});

console.log(`Total fixed lines: ${found}`);
