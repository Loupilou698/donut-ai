export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Clé API manquante' });
  }

  try {
    const { messages, useWebSearch } = req.body;

    if (useWebSearch) {
      const searchRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'web-search-2025-03-05'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          system: 'Recherche des infos récentes sur DonutSMP Minecraft. Réponds uniquement avec un résumé factuel et concis en français. Focus sur prix actuels, méta du moment, stratégies concrètes.',
          messages: [{ role: 'user', content: messages[messages.length - 1].content }]
        })
      });
      const searchData = await searchRes.json();
      const webResults = (searchData.content || [])
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('\n');
      return res.status(200).json({ webResults });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: req.body.system,
        messages
      })
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
