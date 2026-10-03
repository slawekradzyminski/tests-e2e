const response = await fetch('https://api.anthropic.com/v1/models', { headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' } });
if (!response.ok) throw new Error(`Anthropic model discovery HTTP ${response.status}`);
const models = (await response.json()).data.filter(m => /sonnet/i.test(m.id));
console.log(models.map(m => ({id:m.id, name:m.display_name})));
