
export interface GenerateRequest {
  model: string;
  prompt: string;
  think?: boolean;
  options?: Record<string, unknown>;
}

export interface ChatMessage {
  role: string;
  content?: string | null;
  thinking?: string | null;
  tool_name?: string | null;
  tool_calls?: Array<{ function: { name: string; arguments?: Record<string, unknown> } }> | null;
}

export interface ToolDefinition {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, { type: string }>;
      required: string[] | null;
      oneOf: Array<{ required: string[] }> | null;
    };
  };
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  think?: boolean;
  options?: Record<string, unknown>;
}

export interface OllamaEvent {
  model: string;
  created_at: string;
  done: boolean;
  response?: string | null;
  thinking?: string | null;
  message?: ChatMessage | null;
}
