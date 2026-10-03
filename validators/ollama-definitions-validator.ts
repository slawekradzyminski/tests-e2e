
import { expect } from 'e2e';
import type { HttpResponse as APIResponse } from '../support/http';
import type { ToolDefinition } from '../types/ollama';

export async function expectCatalogToolDefinitions(response: APIResponse) {
  expect(response.status(), 'Catalog tools are available').toBe(200);
  expect(response.headers()['content-type']).toMatch(/^application\/json/);
  const definitions: ToolDefinition[] = await response.json();
  expect(definitions.map(tool => tool.function.name).sort(), 'Supported catalog functions').toEqual(['get_product_snapshot', 'list_products']);
  for (const tool of definitions) {
    expect(tool.type).toBe('function');
    expect(tool.function.description, `Description of ${tool.function.name}`).toEqual(expect.stringMatching(/\S/));
    expect(tool.function.parameters.type).toBe('object');
  }
  const snapshot = definitions.find(tool => tool.function.name === 'get_product_snapshot')!.function.parameters;
  expect(snapshot.properties, 'Snapshot lookup accepts an ID or name').toMatchObject({ productId: { type: 'integer' }, name: { type: 'string' } });
  expect(snapshot.oneOf, 'Snapshot lookup requires either identifier').toEqual(expect.arrayContaining([{ required: ['productId'] }, { required: ['name'] }]));
  const list = definitions.find(tool => tool.function.name === 'list_products')!.function.parameters;
  expect(list.properties, 'Catalog browsing supports category, availability and pagination').toMatchObject({
    category: { type: 'string' }, inStockOnly: { type: 'boolean' }, limit: { type: 'integer' }, offset: { type: 'integer' },
  });
}

export async function expectToolDefinitionsUnauthorized(response: APIResponse, message: string) {
  expect(response.status(), 'Tool definitions require authentication').toBe(401);
  expect(response.headers()['content-type']).toMatch(/^application\/json/);
  expect(await response.json()).toEqual({ message });
}
