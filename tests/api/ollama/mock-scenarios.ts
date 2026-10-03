
// Fixed responses from ollama-mock 1.0.9. These assertions require the mock-backed gateway.
export const model = 'qwen3.5:2b';
export const release = {
  prompt: 'Summarize the release plan',
  text: 'Release plan: qwen3.5:2b is the default mock model, frontend hooks can stay untouched, and integration smoke test is scheduled after Phase 4. Ping me if you need more depth.',
  thinking: 'Reviewing the qwen3.5:2b release checklist before drafting the summary...',
};
export const status = {
  prompt: 'Give me a quick status update on the Ollama mock',
  text: 'The Ollama mock is up on port 11434, defaults to qwen3.5:2b, and streams deterministic responses so backend/frontend teams can skip the heavy container during the local profile.',
  thinking: 'Reviewing the latest notes about the local mock server and its qwen3.5:2b default...',
};
export const beauty = {
  prompt: 'What Beauty products do we have available?',
  text: 'The beauty shelf currently offers: Hydrating Face Serum and Velvet Matte Lipstick. Let me know if you want pricing for either product.',
};
export const iphone = {
  prompt: 'What iphones do we have available? Tell me the details about them',
  text: 'According to the catalog we currently have on the qwen3.5:2b default path: iPhone 13 Pro and Samsung Galaxy S21. Snapshot for iPhone 13 Pro: priced at $999 with 5 unit(s) in stock.',
};
