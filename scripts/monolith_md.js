const fs = require('fs');
const path = require('path');

const INPUT_FILE = 'dictionary.json';
const OUTPUT_FILE = 'dictionary.md';

// Load dictionary JSON
const dictionary = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));

let md = `# Dictionary\n---\n`;

Object.entries(dictionary).forEach(([word, data]) => {
    if (data === null) return;
    md += `## ${word}:\n`;
    if (data.meanings) {
        data.meanings.forEach(({ partOfSpeech, definitions, synonyms, antonyms })=> {
            definitions.forEach(def => {
                md += `- _${partOfSpeech}_ - ${def.definition}\n`;
                //console.log(def.definition);
            });
        })
    }
});

fs.writeFileSync(OUTPUT_FILE, md, 'utf8');