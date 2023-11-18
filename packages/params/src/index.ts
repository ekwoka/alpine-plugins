import type { PluginCallback, InterceptorObject } from 'alpinejs';

export const query: PluginCallback = (Alpine) => {
  const reactiveParams: Record<string, string[]> = Alpine.reactive({});
  for (const [key, value] of new URLSearchParams(window.location.search))
    (reactiveParams[key] ??= []).push(value);

  Alpine.effect(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(reactiveParams))
      for (const v of value) v && params.append(key, v);
    history.replaceState(null, '', `?${params.toString()}`);
  });

  const bindQuery = <T extends string | string[]>() => {
    let alias: string;
    return Alpine.interceptor<T>(
      (initialValue, getter, setter, path) => {
        const isArray = Array.isArray(initialValue);
        const lookup = alias || path;
        reactiveParams[lookup] ??= [];
        const initial =
          (isArray ? reactiveParams[lookup] : reactiveParams[lookup]?.[0]) ??
          initialValue;

        setter(initial as T);

        Alpine.effect(() => {
          const value = getter();
          if (Array.isArray(value)) reactiveParams[lookup] = value;
          else reactiveParams[lookup][0] = value;
        });

        Alpine.effect(() => {
          const stored = (
            isArray ? reactiveParams[lookup] : reactiveParams[lookup]?.[0]
          ) as T;
          setter(stored);
        });

        return initial as T;
      },
      (interceptor) =>
        Object.assign(interceptor, {
          as(name: string) {
            alias = name;
            return this;
          },
        }),
    );
  };

  Alpine.query = <T extends string | string[]>(val: T) =>
    bindQuery<T>()(val) as QueryInterceptor<T>;
};

type QueryInterceptor<T extends string | string[]> = InterceptorObject<T> & {
  as: (name: string) => QueryInterceptor<T>;
};

export default query;

declare module 'alpinejs' {
  interface Alpine {
    query: <T extends string | string[]>(val: T) => QueryInterceptor<T>;
  }
}

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
  queryString = queryString.replace('?', '');

  if (queryString === '') return {};

  const entries = new URLSearchParams(queryString).entries();

  const data: Record<string, unknown> = {};
  for (const [key, value] of entries) {
    // Query string params don't always have values... (`?foo=`)
    if (!value) return;

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

const insertDotNotatedValueIntoData = (
  key: string,
  value: unknown,
  data: Record<string, unknown>,
) => {
  const keys = key.split('.');
  const final = keys.pop()!;
  while (keys.length) {
    const key = keys.shift()!;

    // This is where we fill in empty arrays/objects allong the way to the assigment...
    if (data[key] === undefined)
      data[key] = isNaN(Number(keys[0] ?? final)) ? {} : [];

    data = data[key] as Record<string, unknown>;
    // Keep deferring assignment until the full key is built up...
  }
  data[final] = value;
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
