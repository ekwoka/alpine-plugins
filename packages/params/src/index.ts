import type { PluginCallback, InterceptorObject, Alpine } from 'alpinejs';
import { fromQueryString, toQueryString } from './querystring.js';
import {
  retrieveDotNotatedValueFromData,
  objectAtPath,
  deleteDotNotatedValueFromData,
  insertDotNotatedValueIntoData,
} from './pathresolve.js';
import { UpdateMethod, onURLChange, untrack } from './history.js';
import { Encoding, PrimitivesToStrings } from './encoding.js';
export { base64, base64URL } from './encoding.js';
export type { Encoding, PrimitivesToStrings } from './encoding.js';

type _InnerType<T, S> =
  T extends PrimitivesToStrings<T>
    ? T
    : S extends Transformer<T>
      ? T
      : T | PrimitivesToStrings<T>;

/**
 * This is the InterceptorObject that is returned from the `query` function.
 * When inside an Alpine Component or Store, these interceptors are initialized.
 * This hooks up setter/getter methods to to replace the object itself
 * and sync the query string params
 */
class QueryInterceptor<T> implements InterceptorObject<T> {
  _x_interceptor = true as const;
  private alias: string | undefined = undefined;
  private encoder: Encoding<T> = {
    to: (v) => v as PrimitivesToStrings<T>,
    from: (v) => v as T,
  };
  private method: UpdateMethod = UpdateMethod.replace;
  private show: boolean = false;
  public initialValue: T;
  constructor(
    initialValue: T,
    private Alpine: Pick<Alpine, 'effect'>,
    private reactiveParams: Record<string, unknown>,
  ) {
    this.initialValue = initialValue;
  }
  /**
   * Self Initializing interceptor called by Alpine during component initialization
   * @param {object} data The Alpine Data Object (component or store)
   * @param {string} path dot notated path from the data root to the interceptor
   * @returns {T} The value of the interceptor after initialization
   */
  initialize(data: Record<string, unknown>, path: string): T {
    const {
      alias = path,
      Alpine,
      initialValue,
      method,
      reactiveParams,
      show,
      encoder,
    } = this;
    const existing = retrieveDotNotatedValueFromData(
      alias,
      reactiveParams,
    ) as PrimitivesToStrings<T> | null;
    const initial = existing ? encoder.from(existing) : initialValue;

    const keys = path.split('.');
    const final = keys.pop()!;
    const obj = objectAtPath(keys, data, final);

    Object.defineProperty(obj, final, {
      set: (value: T) => {
        !show && value === initialValue
          ? deleteDotNotatedValueFromData(alias, reactiveParams)
          : insertDotNotatedValueIntoData(
              alias,
              encoder.to(value),
              reactiveParams,
            );
      },
      get: () => {
        const existing = retrieveDotNotatedValueFromData(
          alias,
          reactiveParams,
        ) as PrimitivesToStrings<T> | null;
        const value = existing ? encoder.from(existing) : initialValue;
        return value;
      },
      enumerable: true,
    });

    Alpine.effect(paramEffect(alias, reactiveParams, method));

    return initial;
  }
  /**
   * Changes the keyname for using in the query string
   * Keyname defaults to path to data
   * @param {string} name Key alias
   */
  as(name: string) {
    this.alias = name;
    return this;
  }
  /**
   * Transforms the value of the query param before it is set on the data
   * @param {function} fn Transformer function
   */
  into(fn: Transformer<T>): QueryInterceptor<T> {
    this.encoder.from = fn;
    return this;
  }
  /**
   * Always show the initial value in the query string
   */
  alwaysShow() {
    this.show = true;
    return this;
  }
  /**
   * Use pushState instead of replaceState
   */
  usePush() {
    this.method = UpdateMethod.push;
    return this;
  }
  /**
   * Registers encoding and decoding functions to transform the value
   * before it is set on the query string
   */
  encoding(encoder: Encoding<T>): QueryInterceptor<T> {
    this.encoder = encoder;
    return this;
  }
}

export const query: PluginCallback = (Alpine) => {
  const reactiveParams: Record<string, unknown> = Alpine.reactive(
    fromQueryString(location.search),
  );

  const updateParams = (obj: Record<string, unknown>) => {
    Object.assign(reactiveParams, obj);
    for (const key in Alpine.raw(reactiveParams))
      if (!(key in obj)) delete reactiveParams[key];
  };

  window.addEventListener('popstate', (event) => {
    if (!event.state?.query) return;
    updateParams(event.state.query);
  });

  onURLChange((url) => {
    const query = fromQueryString(url.search);
    updateParams(query);
  });

  const bindQuery = <T>(initial: T) =>
    new QueryInterceptor(initial, Alpine, reactiveParams);

  Alpine.query = bindQuery;
  Alpine.magic('query', () => bindQuery);
};

export type Transformer<T> = (val: T | PrimitivesToStrings<T>) => T;

export default query;

declare module 'alpinejs' {
  interface Alpine {
    /**
     * Sync a search param in the query string with the value in the Alpine Context
     * @param initialValue Value when the query param is not present
     * @returns {QueryInterceptor} Self initializing interceptor
     */
    query: <T>(initialValue: T) => QueryInterceptor<T>;
  }
}

/**
 * Creates a new object containing the old history state and new query data
 * @param {object} data Query Data to inject into the current history state
 * @returns {object} New object for the new history state
 */
const intoState = <T extends Record<string, unknown>>(
  data: Record<string, unknown>,
): Record<string, unknown> & { query: T } =>
  Object.assign({}, history.state ?? {}, {
    query: JSON.parse(JSON.stringify(data)),
  });

const paramEffect = (
  key: string,
  params: Record<string, unknown>,
  method: UpdateMethod,
) => {
  let previous = JSON.stringify(params[key]);
  return () => {
    const current = JSON.stringify(params[key]);
    if (current === previous) return;
    untrack(() => setParams(params, method));
    previous = current;
  };
};

/**
 * Sets the query string params to the current reactive params
 */
const setParams = (params: Record<string, unknown>, method: UpdateMethod) => {
  const queryString = toQueryString(params);
  history[method](
    intoState(params),
    '',
    queryString ? `?${queryString}` : location.pathname,
  );
};

if (import.meta.vitest) {
  describe('QueryInterceptor', async () => {
    const Alpine = await import('alpinejs').then((m) => m.default);
    const { base64URL } = await import('./encoding');
    afterEach(() => {
      vi.restoreAllMocks();
    });
    it('defines value on the data', () => {
      const paramObject = Alpine.reactive({});
      const data = { foo: 'bar' };
      new QueryInterceptor('hello', Alpine, paramObject).initialize(
        data,
        'foo',
      );
      expect(data).toEqual({ foo: 'hello' });
    });
    it('stores value in the params', () => {
      const paramObject = Alpine.reactive({});
      const interceptor = new QueryInterceptor('hello', Alpine, paramObject);
      const data = { foo: 'bar' };
      interceptor.initialize(data, 'foo');
      expect(data).toEqual({ foo: 'hello' });
      data.foo = 'world';
      expect(paramObject).toEqual({ foo: 'world' });
      expect(data).toEqual({ foo: 'world' });
    });
    it('returns initial value from initialize', () => {
      expect(
        new QueryInterceptor('hello', Alpine, {}).initialize({}, 'foo'),
      ).toBe('hello');
    });
    it('initializes with value from params', () => {
      const paramObject = { foo: 'hello' };
      const data = { foo: 'bar' };
      expect(
        new QueryInterceptor('hello', Alpine, paramObject).initialize(
          data,
          'foo',
        ),
      ).toBe('hello');
      expect(data).toEqual({ foo: 'hello' });
    });
    it('updates history state', async () => {
      vi.spyOn(history, UpdateMethod.replace);
      const paramObject = Alpine.reactive({});
      const data = { foo: 'bar' };
      new QueryInterceptor('hello', Alpine, paramObject).initialize(
        data,
        'foo',
      );
      expect(data).toEqual({ foo: 'hello' });
      data.foo = 'world';
      await Alpine.nextTick();
      expect(paramObject).toEqual({ foo: 'world' });
      expect(data).toEqual({ foo: 'world' });
      expect(history.replaceState).toHaveBeenCalledWith(
        { query: { foo: 'world' } },
        '',
        '?foo=world',
      );
      data.foo = 'fizzbuzz';
      await Alpine.nextTick();
      expect(paramObject).toEqual({ foo: 'fizzbuzz' });
      expect(data).toEqual({ foo: 'fizzbuzz' });
      expect(history.replaceState).toHaveBeenCalledWith(
        { query: { foo: 'fizzbuzz' } },
        '',
        '?foo=fizzbuzz',
      );
    });
    it('can alias the key', async () => {
      vi.spyOn(history, UpdateMethod.replace);
      const paramObject = Alpine.reactive({});
      const data = { foo: 'bar' };
      new QueryInterceptor('hello', Alpine, paramObject)
        .as('bar')
        .initialize(data, 'foo');
      expect(data).toEqual({ foo: 'hello' });
      data.foo = 'world';
      await Alpine.nextTick();
      expect(paramObject).toEqual({ bar: 'world' });
      expect(data).toEqual({ foo: 'world' });
      expect(history.replaceState).toHaveBeenCalledWith(
        { query: { bar: 'world' } },
        '',
        '?bar=world',
      );
    });
    it('can transform the initial query value', () => {
      const paramObject = { count: '1' };
      const data = { count: 0 };
      data.count = new QueryInterceptor(0, Alpine, paramObject)
        .into(Number)
        .initialize(data, 'count');
      expect(data).toEqual({ count: 1 });
      expect(paramObject).toEqual({ count: 1 });
    });
    it('does not display inital value', async () => {
      vi.spyOn(history, UpdateMethod.replace);
      const paramObject = Alpine.reactive({});
      const data = { foo: 'bar' };
      new QueryInterceptor(data.foo, Alpine, paramObject).initialize(
        data,
        'foo',
      );
      data.foo = 'hello';
      await Alpine.nextTick();
      expect(data).toEqual({ foo: 'hello' });
      expect(paramObject).toEqual({ foo: 'hello' });
      data.foo = 'bar';
      await Alpine.nextTick();
      expect(data).toEqual({ foo: 'bar' });
      expect(paramObject).toEqual({});
      expect(history.replaceState).toHaveBeenCalledWith({ query: {} }, '', '/');
    });
    it('can always show the initial value', async () => {
      vi.spyOn(history, UpdateMethod.replace);
      const paramObject = Alpine.reactive({});
      const data = { foo: 'bar' };
      new QueryInterceptor(data.foo, Alpine, paramObject)
        .alwaysShow()
        .initialize(data, 'foo');
      data.foo = 'hello';
      await Alpine.nextTick();
      expect(data).toEqual({ foo: 'hello' });
      expect(paramObject).toEqual({ foo: 'hello' });
      expect(history.replaceState).toHaveBeenCalledWith(
        { query: { foo: 'hello' } },
        '',
        '?foo=hello',
      );
      data.foo = 'bar';
      await Alpine.nextTick();
      expect(data).toEqual({ foo: 'bar' });
      expect(paramObject).toEqual({ foo: 'bar' });
      expect(history.replaceState).toHaveBeenCalledWith(
        { query: { foo: 'bar' } },
        '',
        '?foo=bar',
      );
    });
    it('can use pushState', async () => {
      vi.spyOn(history, UpdateMethod.replace);
      vi.spyOn(history, UpdateMethod.push);
      const paramObject = Alpine.reactive({});
      const data = { foo: 'bar' };
      new QueryInterceptor(data.foo, Alpine, paramObject)
        .usePush()
        .initialize(data, 'foo');
      data.foo = 'hello';
      await Alpine.nextTick();
      expect(data).toEqual({ foo: 'hello' });
      expect(paramObject).toEqual({ foo: 'hello' });
      expect(history.pushState).toHaveBeenCalledWith(
        { query: { foo: 'hello' } },
        '',
        '?foo=hello',
      );
      expect(history.replaceState).not.toHaveBeenCalled();
    });
    it('can have a defined encoding', async () => {
      vi.spyOn(history, UpdateMethod.replace);
      const paramObject = Alpine.reactive({});
      const data = { foo: '' };
      new QueryInterceptor(data.foo, Alpine, paramObject)
        .encoding(base64URL)
        .initialize(data, 'foo');
      data.foo = '<<???>>';
      await Alpine.nextTick();
      expect(data).toEqual({ foo: '<<???>>' });
      expect(paramObject).toEqual({ foo: 'PDw_Pz8-Pg' });
      expect(history.replaceState).toHaveBeenCalledWith(
        { query: { foo: 'PDw_Pz8-Pg' } },
        '',
        '?foo=PDw_Pz8-Pg',
      );
    });
  });
}

export { observeHistory } from './history';
