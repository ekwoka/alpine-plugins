import type { PluginCallback, InterceptorObject, Alpine } from 'alpinejs';

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
    const final = keys[keys.length - 1];
    const obj = objectAtPath(keys, data);
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

/**
 * Converts Objects to bracketed query strings
 * { items: [['foo']] } -> "items[0][0]=foo"
 * @param params Object to convert to query string
 */
const toQueryString = (data: object) => {
  const entries = buildQueryStringEntries(data);

  return entries.map((entry) => entry.join('=')).join('&');
};

const isObjectLike = (subject: unknown): subject is object =>
  typeof subject === 'object' && subject !== null;

const buildQueryStringEntries = (
  data: object,
  entries: [string, string][] = [],
  baseKey = '',
) => {
  Object.entries(data).forEach(([iKey, iValue]) => {
    const key = baseKey ? `${baseKey}[${iKey}]` : iKey;
    if (iValue === undefined) return;
    if (!isObjectLike(iValue))
      entries.push([
        key,
        encodeURIComponent(iValue)
          .replaceAll('%20', '+') // Conform to RFC1738
          .replaceAll('%2C', ','),
      ]);
    else buildQueryStringEntries(iValue, entries, key);
  });

  return entries;
};

const fromQueryString = (queryString: string) => {
  const data: Record<string, unknown> = {};
  if (queryString === '') return data;

  const entries = new URLSearchParams(queryString).entries();

  for (const [key, value] of entries) {
    // Query string params don't always have values... (`?foo=`)
    if (!value) continue;

    const decoded = value;

    if (!key.includes('[')) data[key] = decoded;
    else {
      // Convert to dot notation because it's easier...
      const dotNotatedKey = key.replaceAll(/\[([^\]]+)\]/g, '.$1');
      insertDotNotatedValueIntoData(dotNotatedKey, decoded, data);
    }
  }

  return data;
};

const objectAtPath = (keys: string[], data: Record<string, unknown>) => {
  const final = keys.pop()!;
  while (keys.length) {
    const key = keys.shift()!;

    // This is where we fill in empty arrays/objects allong the way to the assigment...
    if (data[key] === undefined)
      data[key] = isNaN(Number(keys[0] ?? final)) ? {} : [];
    data = data[key] as Record<string, unknown>;
    // Keep deferring assignment until the full key is built up...
  }
  return data;
};

const insertDotNotatedValueIntoData = (
  path: string,
  value: unknown,
  data: Record<string, unknown>,
) => {
  const keys = path.split('.');
  const final = keys[keys.length - 1];
  data = objectAtPath(keys, data);
  data[final] = value;
};

const retrieveDotNotatedValueFromData = (
  path: string,
  data: Record<string, unknown>,
) => {
  const keys = path.split('.');
  const final = keys[keys.length - 1];
  data = objectAtPath(keys, data);
  return data[final];
};

const deleteDotNotatedValueFromData = (
  path: string,
  data: Record<string, unknown>,
) => {
  const keys = path.split('.');
  const final = keys[keys.length - 1];
  data = objectAtPath(keys, data);
  delete data[final];
};

if (import.meta.vitest) {
  describe('QueryString', () => {
    it('builds query string from objects', () => {
      expect(toQueryString({ foo: 'bar' })).toBe('foo=bar');
      expect(toQueryString({ foo: ['bar'] })).toBe('foo[0]=bar');
      expect(toQueryString({ foo: [['bar']] })).toBe('foo[0][0]=bar');
      expect(toQueryString({ foo: { bar: 'baz' } })).toBe('foo[bar]=baz');
      expect(toQueryString({ foo: { bar: ['baz'] } })).toBe('foo[bar][0]=baz');
      expect(toQueryString({ foo: 'bar', fizz: [['buzz']] })).toBe(
        'foo=bar&fizz[0][0]=buzz',
      );
      expect(toQueryString({ foo: 'fizz buzz, foo bar' })).toBe(
        'foo=fizz+buzz,+foo+bar',
      );
    });
    it('parses query string to objects', () => {
      expect(fromQueryString('foo=bar')).toEqual({ foo: 'bar' });
      expect(fromQueryString('foo[0]=bar')).toEqual({ foo: ['bar'] });
      expect(fromQueryString('foo[0][0]=bar')).toEqual({ foo: [['bar']] });
      expect(fromQueryString('foo[bar]=baz')).toEqual({ foo: { bar: 'baz' } });
      expect(fromQueryString('foo[bar][0]=baz')).toEqual({
        foo: { bar: ['baz'] },
      });
      expect(fromQueryString('foo=bar&fizz[0][0]=buzz')).toEqual({
        foo: 'bar',
        fizz: [['buzz']],
      });
      expect(fromQueryString('foo=fizz+buzz,+foo+bar')).toEqual({
        foo: 'fizz buzz, foo bar',
      });
    });
  });
}
