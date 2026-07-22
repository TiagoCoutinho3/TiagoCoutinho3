const fs = require('fs');
const path = require('path');

const githubUser = process.env.GITHUB_REPOSITORY_OWNER || 'TiagoCoutinho3';

async function fetchContributionsPage(username) {
  const res = await fetch(`https://github.com/users/${username}/contributions`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  if (!res.ok) {
    throw new Error(`GitHub retornou status ${res.status}`);
  }

  return res.text();
}

function extractContributionCount(html) {
  // Pega os números de cada tooltip: "X contributions on Month Dayth."
  const tooltipRegex = /(\d+)\s+contributions?\s+on\s+\w+\s+\d+(?:st|nd|rd|th)\./gi;
  const matches = [...html.matchAll(tooltipRegex)];

  return matches.reduce((total, match) => total + parseInt(match[1], 10), 0);
}

async function getContributionCount() {
  try {
    const html = await fetchContributionsPage(githubUser);
    return extractContributionCount(html);
  } catch (error) {
    console.error(`Erro ao buscar contribuições: ${error.message}`);
    return 0;
  }
}

function updateReadme(contributionCount) {
  const readmePath = path.join(__dirname, '..', 'README.md');
  let content = fs.readFileSync(readmePath, 'utf8');

  const newTitle = `## 🐍 Snake (${contributionCount.toLocaleString()} contributions) { #snake }`;

  content = content.replace(
    /## 🐍 Snake(?: \(\d+(?:,\d+)* (?:commits|contributions)\))?(?: \{ #snake \})?/,
    newTitle
  );

  fs.writeFileSync(readmePath, content, 'utf8');
  console.log(`Título atualizado: ${contributionCount.toLocaleString()} contributions`);
}

async function main() {
  console.log(`Buscando contribuições de ${githubUser}...`);
  const contributionCount = await getContributionCount();
  console.log(`Encontradas ${contributionCount.toLocaleString()} contribuições no último ano`);
  updateReadme(contributionCount);
}

main().catch((error) => {
  console.error(`Erro: ${error.message}`);
  process.exit(1);
});