import type { Browser } from '@e2e-dev/web';
import type { Screen } from 'e2e';
import { HttpClient } from './http';

export interface PageContext { screen: Screen; browser: Browser; request: HttpClient }
export type FixtureFactory = (fixtures: any, use: (value: any) => Promise<void>) => Promise<void>;
export type FixtureRegistry = Record<string, FixtureFactory>;
export const requestFixture: FixtureFactory = async ({}, use) => { await use(new HttpClient()); };
export const pageFixture: FixtureFactory = async (fixtures, use) => {
  const { app, browser, screen, request } = fixtures;
  const storageState = Object.hasOwn(fixtures, 'storageState') ? fixtures.storageState : undefined;
  await app.open('/');
  if (storageState) {
    await browser.evaluate((state: { origins: { origin: string; localStorage: { name: string; value: string }[] }[] }) => {
      for (const origin of state.origins) {
        if (origin.origin === location.origin) for (const entry of origin.localStorage) localStorage.setItem(entry.name, entry.value);
      }
    }, storageState);
  }
  await use({ screen, browser, request } satisfies PageContext);
};
/** e2e custom fixtures are eager. Select the exact graph needed by each scenario before registration. */
export function selectFixtures(registry: FixtureRegistry, dependencies: Record<string, string[]>, requested: string[]): FixtureRegistry {
  const selected: FixtureRegistry = {};
  const visiting = new Set<string>();
  function add(name: string) {
    if (name === 'request' || name in selected || !(name in registry)) return;
    if (visiting.has(name)) throw new Error(`Circular fixture dependency: ${name}`);
    visiting.add(name);
    for (const dependency of dependencies[name] ?? []) add(dependency);
    if (name === 'page' && registry.storageState) add('storageState');
    selected[name] = registry[name];
    visiting.delete(name);
  }
  for (const name of requested) add(name);
  return selected;
}
