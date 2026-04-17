export default async function handler(req, res) {
  // Permitir apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { book, chapter } = req.body;
  if (!book || !chapter) {
    return res.status(400).json({ error: 'Livro e capítulo são obrigatórios' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: `Você é um guia bíblico devocional em português brasileiro.
Gere um resumo devocional para ${book} capítulo ${chapter}.

Responda APENAS com JSON válido, sem markdown:
{"summary":"resumo de 2-3 frases sobre o conteúdo principal do capítulo","theme":"mensagem central para o leitor hoje (1 frase curta e impactante)","challenge":"desafio prático e espiritual baseado neste capítulo (2 frases)","god_comment":{"verse":1,"text":"comentário íntimo de Deus como se falasse diretamente ao leitor sobre um versículo impactante (2-3 frases)"}}`
        }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text.trim().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);

    // Cache por 30 dias
    res.setHeader('Cache-Control', 's-maxage=2592000');
    return res.status(200).json(parsed);

  } catch (error) {
    return res.status(500).json({ error: 'Erro ao gerar resumo' });
  }
}
