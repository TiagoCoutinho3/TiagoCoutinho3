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

function getWeatherEmoji(conditionText, rawEmoji) {
  if (rawEmoji && rawEmoji !== '✨' && rawEmoji !== '⚡') {
    return rawEmoji;
  }
  const text = (conditionText || '').toLowerCase();
  if (text.includes('sun') || text.includes('clear') || text.includes('ensolarado') || text.includes('limpo')) return '☀️';
  if (text.includes('rain') || text.includes('drizzle') || text.includes('shower') || text.includes('chuva')) return '🌧️';
  if (text.includes('cloud') || text.includes('overcast') || text.includes('nublado') || text.includes('haze') || text.includes('mist') || text.includes('fog')) return '⛅';
  if (text.includes('thunder') || text.includes('storm') || text.includes('tempestade') || text.includes('trovoada')) return '🌩️';
  if (text.includes('snow') || text.includes('neve')) return '❄️';
  return rawEmoji || '☀️';
}

async function fetchWeather() {
  try {
    const res = await fetch('https://wttr.in/Rio_de_Janeiro?format=%t|%C|%c', {
      headers: {
        'User-Agent': 'curl/7.68.0'
      }
    });
    if (!res.ok) {
      throw new Error(`wttr.in retornou status ${res.status}`);
    }
    const text = (await res.text()).trim();
    const parts = text.split('|');

    if (parts.length >= 3) {
      const temp = parts[0].trim();
      const conditionText = parts[1].trim();
      const rawEmoji = parts[2].trim();
      const emoji = getWeatherEmoji(conditionText, rawEmoji);
      return `${temp} ${emoji}`;
    }

    return text.replace(/\|/g, ' ');
  } catch (error) {
    console.error(`Erro ao buscar clima: ${error.message}`);
    return 'N/A';
  }
}

function getBrazilDate() {
  const options = { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' };
  const formatter = new Intl.DateTimeFormat('pt-BR', options);
  return formatter.format(new Date());
}

function updateReadme(contributionCount, weatherInfo, dateStr) {
  const readmePath = path.join(__dirname, '..', 'README.md');
  let content = fs.readFileSync(readmePath, 'utf8');

  const newTitle = `## 🐍 Snake (${contributionCount.toLocaleString()} contributions) { #snake }`;

  content = content.replace(
    /## 🐍 Snake(?: \(\d+(?:,\d+)* (?:commits|contributions)\))?(?: \{ #snake \})?/,
    newTitle
  );

  const dailyInfoRegex = /<!-- DAILY_INFO_START -->[\s\S]*?<!-- DAILY_INFO_END -->/;
  const newDailyInfo = `<!-- DAILY_INFO_START -->\n${dateStr}\nRio de Janeiro, ${weatherInfo}\n<!-- DAILY_INFO_END -->`;

  if (dailyInfoRegex.test(content)) {
    content = content.replace(dailyInfoRegex, newDailyInfo);
  }

  fs.writeFileSync(readmePath, content, 'utf8');
  console.log(`README atualizado com sucesso (Contribuições: ${contributionCount}, Data: ${dateStr}, Clima: ${weatherInfo})`);
}

async function main() {
  console.log(`Buscando contribuições de ${githubUser}...`);
  const contributionCount = await getContributionCount();
  console.log(`Encontradas ${contributionCount.toLocaleString()} contribuições no último ano`);

  console.log('Buscando clima do Rio de Janeiro...');
  const weatherInfo = await fetchWeather();
  const dateStr = getBrazilDate();

  updateReadme(contributionCount, weatherInfo, dateStr);
}

main().catch((error) => {
  console.error(`Erro: ${error.message}`);
  process.exit(1);
});