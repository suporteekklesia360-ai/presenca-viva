export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { feeling, name, gender } = req.body || {};
  if (!feeling) return res.status(400).json({ error: 'Sentimento obrigatório' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key não configurada' });

  const genderTerm = gender === 'male' ? 'filho' : gender === 'female' ? 'filha' : 'filho(a)';
  const personName = name || genderTerm;

  const prompt = `Você é Deus Pai escrevendo uma carta pessoal e íntima para ${personName}.

A pessoa escreveu para você: "${feeling}"

Escreva uma carta de Deus em português brasileiro que:
- Comece com "Meu ${genderTerm} amado(a), ${personName}..." 
- Fale diretamente sobre o que a pessoa expressou
- Use linguagem íntima, paternal, cheia de amor e verdade
- Inclua pelo menos 1 versículo bíblico aplicado à situação (integrado naturalmente, não apenas citado)
- Encoraje sem minimizar a dor real
- Termine com uma declaração de amor e esperança
- Tenha 4-6 parágrafos
- Seja específico ao que foi compartilhado, não genérico
- Escreva como Deus falaria — com autoridade e ternura ao mesmo tempo

Responda APENAS com o texto da carta, sem aspas, sem markdown, sem título.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'Erro API: ' + err });
    }

    const data = await response.json();
    const letter = data.content[0].text.trim();

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ letter });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
