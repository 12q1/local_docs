const fs = require('fs');
const path = require('path');

const INPUT_FILE = 'words_dictionary.json';
const OUTPUT_FILE = 'dictionary.json';
const API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const DELAY_MS = 500; // Adjust to prevent API rate limits
const SAVE_INTERVAL = 100; // Save progress every N words

// Load word list
const words = Object.keys(JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8')));
const outputFilePath = path.resolve(OUTPUT_FILE);

// Load previous results (if available) to resume progress
const result = fs.existsSync(outputFilePath) ? JSON.parse(fs.readFileSync(outputFilePath, 'utf8')) : {};

// Filter words that haven't been checked yet (whether successful or failed)
const remainingWords = words.filter(word => !(word in result));

// Delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to clean empty arrays recursively
const cleanObject = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map(cleanObject).filter(item => item && !(Array.isArray(item) && item.length === 0));
    } else if (obj && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj)
                .map(([key, value]) => [key, cleanObject(value)])
                .filter(([_, value]) => value !== null && value !== undefined && !(Array.isArray(value) && value.length === 0))
        );
    }
    return obj;
};

// Fetch word definition (always marks word as checked)
async function fetchDefinition(word) {
    try {
        const response = await fetch(`${API_URL}${word}`);
        if (response.status === 404) {
            console.log(`❌ No definition found: ${word} ${response.status}`);
            result[word] = null; // Mark as checked but no definition found
            return;
        }
        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
            result[word] = null; // No definition
            return;
        }

        result[word] = {
            word,
            meanings: cleanObject(data[0].meanings),
            source: data[0].sourceUrls[0]
        };

        console.log(`✅ Fetched: ${word}`);
    } catch (error) {
        console.warn(`⚠️ Error fetching "${word}": ${error.message}`);
        result[word] = { error: error.message }; // Mark as checked even if failed
    }
}

// Fetch words sequentially with controlled rate limiting
async function fetchAllDefinitions() {
    console.log(`📢 Starting fetch for ${remainingWords.length} remaining words.`);
    
    for (let i = 0; i < remainingWords.length; i++) {
        const word = remainingWords[i];
        await fetchDefinition(word);

        // Save progress periodically
        if ((i + 1) % SAVE_INTERVAL === 0 || i === remainingWords.length - 1) {
            fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2));
            console.log(`💾 Progress saved: ${Object.keys(result).length} words checked.`);
        }

        await delay(DELAY_MS); // Ensure we respect rate limits
    }

    console.log('🎉 Fetch complete! All definitions saved.');
}

fetchAllDefinitions();
