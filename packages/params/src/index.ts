import type { PluginCallback, InterceptorObject } from 'alpinejs';

export const query: PluginCallback = (Alpine) => {
  const reactiveParams: Record<string, unknown> = Alpine.reactive(
    fromQueryString(location.search),
  );

  const intoState = () =>
    Object.assign({}, history.state ?? {}, {
      query: JSON.parse(JSON.stringify(Alpine.raw(reactiveParams))),
    });

  window.addEventListener('popstate', (event) => {
    if (event.state?.query) Object.assign(reactiveParams, event.state.query);
  });

  Alpine.effect(() => {
    if (JSON.stringify(reactiveParams) === JSON.stringify(history.state?.query))
      return;
    history.pushState(intoState(), '', `?${toQueryString(reactiveParams)}`);
  });

  const bindQuery = <T>(): ((initial: T) => QueryInterceptor<T>) => {
    let alias: string;
    const obj: QueryInterceptor<T> = {
      initialValue: undefined as T,
      _x_interceptor: true,
      initialize(data, path) {
        const lookup = alias || path;
        const initial =
          retrieveDotNotatedValueFromData(lookup, reactiveParams) ??
          this.initialValue;

        const keys = path.split('.');
        const final = keys[keys.length - 1];
        data = objectAtPath(keys, data);
        Object.defineProperty(data, final, {
          set(value: T) {
            insertDotNotatedValueIntoData(lookup, value, reactiveParams);
          },
          get() {
            return retrieveDotNotatedValueFromData(lookup, reactiveParams) as T;
          },
        });

        return initial as T;
      },
      as(name: string) {
        alias = name;
        return this;
      },
    };

    return (initial) => {
      obj.initialValue = initial;
      return obj;
    };
  };

  Alpine.query = <T>(val: T) => bindQuery<T>()(val) as QueryInterceptor<T>;
};

type QueryInterceptor<T> = InterceptorObject<T> & {
  as: (name: string) => QueryInterceptor<T>;
};

export default query;

declare module 'alpinejs' {
  interface Alpine {
    query: <T>(val: T) => QueryInterceptor<T>;
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
  key: string,
  value: unknown,
  data: Record<string, unknown>,
) => {
  const keys = key.split('.');
  const final = keys[keys.length - 1];
  data = objectAtPath(keys, data);
  data[final] = value;
};

const retrieveDotNotatedValueFromData = (
  key: string,
  data: Record<string, unknown>,
) => {
  const keys = key.split('.');
  const final = keys[keys.length - 1];
  data = objectAtPath(keys, data);
  return data[final];
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
