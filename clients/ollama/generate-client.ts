
import type { GenerateRequest } from '../../types/ollama';
import { postSse } from './sse-response';

export class GenerateClient {
  generate(data: Partial<GenerateRequest>, token?: string) {
    return postSse('/api/v1/ollama/generate', data, token);
  }
}
