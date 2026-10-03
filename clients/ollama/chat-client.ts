
import type { ChatRequest } from '../../types/ollama';
import { postSse } from './sse-response';

export class ChatClient {
  chat(data: Partial<ChatRequest>, token?: string) {
    return postSse('/api/v1/ollama/chat', data, token);
  }
}
