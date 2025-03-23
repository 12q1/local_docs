const fs = require('fs');
const path = require('path');

const INPUT_FILE = 'dictionary.json';
const OUTPUT_DIR = 'words';
const INDEX_FILE = path.join(OUTPUT_DIR, '__index.md');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

// Load dictionary JSON
const dictionary = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
const wordsList = new Set(Object.keys(dictionary));

// Common stopwords to avoid excessive linking
const stopwords = new Set(["the", "is", "to", "and", "a", "an", "of", "in", "on", "for", "with", "at", "by", "from", "that", "it", "as", "be", "this", "are", "was", "or", "but", "not"]);

// Function to interlink words in definitions while avoiding stopwords
function interlinkText(text) {
    if (!text) return text;
    return text.replace(/\b([a-zA-Z]+)\b/g, (match) => {
        const lowerMatch = match.toLowerCase();
        if (wordsList.has(lowerMatch) && !stopwords.has(lowerMatch)) {
            const firstLetter = lowerMatch[0];
            return `[[${firstLetter}/_${lowerMatch}|${match}]]`; // Corrected link
        }
        return match;
    });
}

function capitalize(str){
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Function to format meanings into Markdown
function formatMarkdown(word, data) {
    if (!data) return null; // Skip null/undefined words

    let md = `# ${capitalize(word)}\n`;
    md += `---\n`;

    if (data.meanings) {
        data.meanings.forEach(({ partOfSpeech, definitions, synonyms, antonyms }) => {
            const tag = `#${partOfSpeech.replace(/\s+/g, '').toLowerCase()}`;
            md += `${tag}\n`;
            
            definitions.forEach(def => {
                md += `- **${def.definition}**\n`;
                if (def.example) {
                    md += `	- _Example: ${def.example}_\n`;
                }
            });

            md += `---\n`;

            if (synonyms && synonyms.length > 0) {
                md += `### Synonyms\n- ${synonyms.map(s => `[[${interlinkText(s)}]]`).join(', ')}\n`;
            }

            if (antonyms && antonyms.length > 0) {
                md += `### Antonyms\n- ${antonyms.map(a => `[[${interlinkText(a)}]]`).join(', ')}\n`;
            }

        });
    }

    md += `---\n`;
    return md;
}

// Generate markdown files & collect index entries
let indexContent = `# Dictionary Index\n\n`;
Object.entries(dictionary).forEach(([word, data]) => {
    if (!word) return; // Skip null/empty words

    const firstLetter = word[0].toLowerCase();
    const folderPath = path.join(OUTPUT_DIR, firstLetter);

    // Ensure letter folder exists
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }

    // Add underscore prefix to the filename
    const filePath = path.join(folderPath, `_${word}.md`);
    const markdownContent = formatMarkdown(word, data);

    if (markdownContent) {
        fs.writeFileSync(filePath, markdownContent, 'utf8');
        console.log(`📄 Created: ${filePath}`);
        indexContent += `- [[${firstLetter}/_${word}|${word}]]\n`;
    }
});


// Write index file
fs.writeFileSync(INDEX_FILE, indexContent, 'utf8');
console.log(`📖 Index created: ${INDEX_FILE}`);

console.log(`🎉 Conversion complete! Markdown files saved in '${OUTPUT_DIR}'`);
