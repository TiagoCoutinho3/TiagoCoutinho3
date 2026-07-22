const https = require('https');
const fs = require('fs');
const path = require('path');

const githubUser = process.env.GITHUB_REPOSITORY_OWNER || 'TiagoCoutinho3';

function fetchProfilePage(username) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'github.com',
      path: `/${username}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractContributionCount(html) {
  // Look for the pattern "X contributions in the last year"
  const regex = /(\d+(?:,\d+)*)\s+contributions\s+in\s+the\s+last\s+year/i;
  const match = html.match(regex);
  
  if (match) {
    // Remove commas and convert to number
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  
  // Fallback: try to find any number followed by "contribution"
  const fallbackRegex = /(\d+(?:,\d+)*)\s+contribution/i;
  const fallbackMatch = html.match(fallbackRegex);
  
  if (fallbackMatch) {
    return parseInt(fallbackMatch[1].replace(/,/g, ''), 10);
  }
  
  return 0;
}

function updateReadme(commitCount) {
  const readmePath = path.join(__dirname, '..', 'README.md');
  let content = fs.readFileSync(readmePath, 'utf8');
  
  // Update the snake section title with commit count
  const newTitle = `## 🐍 Snake (${commitCount.toLocaleString()} contributions) { #snake }`;
  content = content.replace(
    /## 🐍 Snake(?: \(\d+(?:,\d+)* (?:commits|contributions)\))?(?: \{ #snake \})?/,
    newTitle
  );
  
  fs.writeFileSync(readmePath, content, 'utf8');
  console.log(`Updated contribution count to ${commitCount.toLocaleString()}`);
}

async function main() {
  try {
    console.log(`Fetching profile page for ${githubUser}...`);
    const html = await fetchProfilePage(githubUser);
    
    const contributionCount = extractContributionCount(html);
    console.log(`Found ${contributionCount.toLocaleString()} contributions in the last year`);
    
    updateReadme(contributionCount);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
