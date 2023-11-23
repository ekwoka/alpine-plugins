import type { PluginCallback, InterceptorObject, Alpine } from 'alpinejs';
import { fromQueryString, toQueryString } from './querystring';
import {
  retrieveDotNotatedValueFromData,
  objectAtPath,
  deleteDotNotatedValueFromData,
  insertDotNotatedValueIntoData,
} from './pathresolve';

class QueryInterceptor<T> implements InterceptorObject<T> {
  _x_interceptor = true as const;
  private alias: string | undefined = undefined;
  private transformer: Transformer<T> | null = null;
  private method: 'replaceState' | 'pushState' = 'replaceState';
  private show: boolean = false;
  constructor(
    public initialValue: T,
    private Alpine: Alpine,
    private reactiveParams: Record<string, unknown>,
  ) {}
  initialize(data: Record<string, unknown>, path: string) {
    const {
      alias = path,
      initialValue,
      reactiveParams,
      transformer,
      show,
    } = this;
    const initial =
      (retrieveDotNotatedValueFromData(alias, reactiveParams) as T) ??
      initialValue;

    const keys = path.split('.');
    const final = keys.pop()!;
    const obj = objectAtPath(keys, data, final);

    Object.defineProperty(obj, final, {
      set: (value: T) => {
        !show && value === initialValue
          ? deleteDotNotatedValueFromData(alias, reactiveParams)
          : insertDotNotatedValueIntoData(alias, value, reactiveParams);
        this.setParams();
      },
      get: () => {
        const value = (retrieveDotNotatedValueFromData(alias, reactiveParams) ??
          initialValue) as T;
        return value;
      },
      enumerable: true,
    });

    return transformer?.(initial) ?? initial;
  }
  private setParams() {
    const { reactiveParams, method, Alpine } = this;
    history[method](
      intoState(Alpine.raw(reactiveParams)),
      '',
      `?${toQueryString(Alpine.raw(reactiveParams))}`,
    );
  }
  as(name: string) {
    this.alias = name;
    return this;
  }
  into(fn: Transformer<T>) {
    this.transformer = fn;
    return this;
  }
  alwaysShow() {
    this.show = true;
    return this;
  }
  usePush() {
    this.method = 'pushState';
    return this;
  }
}

export const query: PluginCallback = (Alpine) => {
  const reactiveParams: Record<string, unknown> = Alpine.reactive(
    fromQueryString(location.search),
  );

  window.addEventListener('popstate', (event) => {
    if (!event.state?.query) return;
    if (event.state.query) Object.assign(reactiveParams, event.state.query);
    for (const key in Alpine.raw(reactiveParams))
      if (!(key in event.state.query)) delete reactiveParams[key];
  });

  const bindQuery = <T>(initial: T) =>
    new QueryInterceptor(initial, Alpine, reactiveParams);

  Alpine.query = bindQuery;
  Alpine.magic('query', () => bindQuery);
};

type Transformer<T> = (val: string | T) => T;

export default query;

declare module 'alpinejs' {
  interface Alpine {
    query: <T>(val: T) => QueryInterceptor<T>;
  }
}

const intoState = (data: Record<string, unknown>) =>
  Object.assign({}, history.state ?? {}, {
    query: JSON.parse(JSON.stringify(data)),
  });

if (import.meta.vitest) {
  describe('QueryInterceptor', () => {
    const Alpine = {
      raw<T>(val: T): T {
        return val;
      },
      reactive<T>(val: T): T {
        return val;
      },
    } as unknown as Alpine;
    afterEach(() => {
      vi.restoreAllMocks();
    });
    it('defines value on the data', () => {
      const paramObject = {};
      const data = { foo: 'bar' };
      new QueryInterceptor('hello', Alpine, paramObject).initialize(
        data,
        'foo',
      );
      expect(data).toEqual({ foo: 'hello' });
    });
    it('stores value in the params', () => {
      const paramObject = {};
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
    it('updates history state', () => {
      vi.spyOn(history, 'replaceState');
      const paramObject = {};
      const data = { foo: 'bar' };
      new QueryInterceptor('hello', Alpine, paramObject).initialize(
        data,
        'foo',
      );
      expect(data).toEqual({ foo: 'hello' });
      data.foo = 'world';
      expect(paramObject).toEqual({ foo: 'world' });
      expect(data).toEqual({ foo: 'world' });
      expect(history.replaceState).toHaveBeenCalledWith(
        { query: { foo: 'world' } },
        '',
        '?foo=world',
      );
      data.foo = 'fizzbuzz';
      expect(paramObject).toEqual({ foo: 'fizzbuzz' });
      expect(data).toEqual({ foo: 'fizzbuzz' });
      expect(history.replaceState).toHaveBeenCalledWith(
        { query: { foo: 'fizzbuzz' } },
        '',
        '?foo=fizzbuzz',
      );
    });
    it('can alias the key', () => {
      vi.spyOn(history, 'replaceState');
      const paramObject = {};
      const data = { foo: 'bar' };
      new QueryInterceptor('hello', Alpine, paramObject)
        .as('bar')
        .initialize(data, 'foo');
      expect(data).toEqual({ foo: 'hello' });
      data.foo = 'world';
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
    it('does not display inital value', () => {
      vi.spyOn(history, 'replaceState');
      const paramObject = {};
      const data = { foo: 'bar' };
      new QueryInterceptor(data.foo, Alpine, paramObject).initialize(
        data,
        'foo',
      );
      data.foo = 'hello';
      expect(data).toEqual({ foo: 'hello' });
      expect(paramObject).toEqual({ foo: 'hello' });
      data.foo = 'bar';
      expect(data).toEqual({ foo: 'bar' });
      expect(paramObject).toEqual({});
      expect(history.replaceState).toHaveBeenCalledWith({ query: {} }, '', '?');
    });
    it('can always show the initial value', () => {
      vi.spyOn(history, 'replaceState');
      const paramObject = {};
      const data = { foo: 'bar' };
      new QueryInterceptor(data.foo, Alpine, paramObject)
        .alwaysShow()
        .initialize(data, 'foo');
      data.foo = 'hello';
      expect(data).toEqual({ foo: 'hello' });
      expect(paramObject).toEqual({ foo: 'hello' });
      expect(history.replaceState).toHaveBeenCalledWith(
        { query: { foo: 'hello' } },
        '',
        '?foo=hello',
      );
      data.foo = 'bar';
      expect(data).toEqual({ foo: 'bar' });
      expect(paramObject).toEqual({ foo: 'bar' });
      expect(history.replaceState).toHaveBeenCalledWith(
        { query: { foo: 'bar' } },
        '',
        '?foo=bar',
      );
    });
    it('can use pushState', () => {
      vi.spyOn(history, 'replaceState');
      vi.spyOn(history, 'pushState');
      const paramObject = {};
      const data = { foo: 'bar' };
      new QueryInterceptor(data.foo, Alpine, paramObject)
        .usePush()
        .initialize(data, 'foo');
      data.foo = 'hello';
      expect(data).toEqual({ foo: 'hello' });
      expect(paramObject).toEqual({ foo: 'hello' });
      expect(history.pushState).toHaveBeenCalledWith(
        { query: { foo: 'hello' } },
        '',
        '?foo=hello',
      );
      expect(history.replaceState).not.toHaveBeenCalled();
    });
  });
}
