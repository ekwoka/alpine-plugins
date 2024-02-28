import type { Alpine } from 'alpinejs';
import type { Assertion } from 'vitest';

export const $scope = Symbol('$scope');

/**
 * Alpine Scope Plugin registers `$scope` magic property and `x-scope` directive.
 * Allows reaching into specific parent component contexts to access their data.
 * @param Alpine {Alpine}
 */
export const Scope = (Alpine: Alpine) => {
  type Scopable = { [$scope]?: Map<string, HTMLElement> };
  Alpine.directive('scope', (el, { expression }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const context = Alpine.$data(el) as Scopable;

    const rootContext = Alpine.closestDataStack(el)[0];
    if (!rootContext) return;
    rootContext[$scope] = new Map(context[$scope]).set(expression, el);
  });
  Alpine.magic('scope', (el) => {
    return new Proxy(
      {},
      {
        get(_, name: string) {
          const scopes = (Alpine.$data(el) as Scopable)[$scope];
          if (scopes?.has(name)) return Alpine.$data(scopes.get(name)!);
          const root = Alpine.findClosest(el, (el) =>
            el.matches(`[x-data="${name}"]`),
          ) as HTMLElement | undefined;
          if (root) return Alpine.$data(root);
          return undefined;
        },
      },
    );
  });
};

export default Scope;

declare module 'alpinejs' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface Magics<T> {
    /**
     * A `Proxy` of the parent component scopes
     */
    $scope: Record<string, unknown>;
  }
}

if (import.meta.vitest) {
  describe('$scope', () => {
    it('can access implicitely scoped context', async () => {
      const root = await render(
        `
        <div x-data="foo">
        <div x-data="bar">
        <span id="naked" x-text="value"></span>
        <span id="foo" x-text="$scope.foo?.value"></span>
        <span id="bar" x-text="$scope.bar?.value"></span>
        </div>
        </div>
        `.trim(),
      )
        .withComponent('foo', () => ({ value: 'foo' }))
        .withComponent('bar', () => ({ value: 'bar' }))
        .withPlugin(Scope);
      expect((root as HTMLElement).querySelector('#naked')).toHaveTextContent(
        'bar',
      );
      expect((root as HTMLElement).querySelector('#foo')).toHaveTextContent(
        'foo',
      );
      expect((root as HTMLElement).querySelector('#bar')).toHaveTextContent(
        'bar',
      );
    });
    it('can access explicitely scoped context', async () => {
      const root = await render(
        `
                <div x-data="{ value: 'foo' }" x-scope="foo">
                <div x-data="{ value: 'bar' }" x-scope="bar">
                <span id="naked" x-text="value"></span>
                <span id="foo" x-text="$scope.foo?.value"></span>
                <span id="bar" x-text="$scope.bar?.value"></span>
                </div>
                </div>
                `.trim(),
      ).withPlugin(Scope);
      expect((root as HTMLElement).querySelector('#naked')).toHaveTextContent(
        'bar',
      );
      expect((root as HTMLElement).querySelector('#foo')).toHaveTextContent(
        'foo',
      );
      expect((root as HTMLElement).querySelector('#bar')).toHaveTextContent(
        'bar',
      );
    });
    it('favors explicitely scoped contexts', async () => {
      const root = await render(
        `
                        <div x-data="foo" x-scope="bar">
                        <div x-data="bar">
                        <span id="naked" x-text="value"></span>
                        <span id="bar" x-text="$scope.bar?.value"></span>
                        </div>
                        </div>
                        `.trim(),
      )
        .withComponent('foo', () => ({ value: 'foo' }))
        .withComponent('bar', () => ({ value: 'bar' }))
        .withPlugin(Scope);
      expect((root as HTMLElement).querySelector('#naked')).toHaveTextContent(
        'bar',
      );
      expect((root as HTMLElement).querySelector('#bar')).toHaveTextContent(
        'foo',
      );
    });
    it('does not leak', async () => {
      const root = await render(
        `
                              <div x-data="{ value: 'root' }">
                              <div x-data="foo" x-scope="foo"></div>
                              <div x-data="bar">
                              </div>
                              <span id="naked" x-text="value"></span>
                              <span id="foo" x-text="$scope.foo?.value ?? 'not found'"></span>
                              <span id="bar" x-text="$scope.bar?.value ?? 'not found'"></span>
                              </div>
                              `.trim(),
      )
        .withComponent('foo', () => ({ value: 'foo' }))
        .withComponent('bar', () => ({ value: 'bar' }))
        .withPlugin(Scope);
      expect((root as HTMLElement).querySelector('#naked')).toHaveTextContent(
        'root',
      );
      expect((root as HTMLElement).querySelector('#foo')).toHaveTextContent(
        'not found',
      );
      expect((root as HTMLElement).querySelector('#bar')).toHaveTextContent(
        'not found',
      );
    });
  });
}
declare module 'vitest' {
  interface Assertion<T> extends AlpineMatchers<T> {}
}

interface AlpineMatchers<T> {
  toHaveTextContent: (expected: string) => Assertion<T>;
}
