import { insertDotNotatedValueIntoData, isForbidden } from './pathresolve';

/**
 * Converts Objects to bracketed query strings
 * { items: [['foo']] } -> "items[0][0]=foo"
 * @param params Object to convert to query string
 */
export const toQueryString = (data: object) => {
  const entries = buildQueryStringEntries(data);

  return entries.map((entry) => entry.join('=')).join('&');
};

export const isObjectLike = (subject: unknown): subject is object =>
  typeof subject === 'object' && subject !== null;

export const buildQueryStringEntries = (
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

export const fromQueryString = (queryString: string) => {
  const data: Record<string, unknown> = Object.create(null);
  if (queryString === '') return data;

  const entries = new URLSearchParams(queryString).entries();

  for (const [key, value] of entries) {
    if (isForbidden(key)) continue;
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

if (import.meta.vitest) {
  describe('QueryString', () => {
    const cases: [object, string][] = [
      [{ foo: 'bar' }, 'foo=bar'],
      [{ foo: ['bar'] }, 'foo[0]=bar'],
      [{ foo: [['bar']] }, 'foo[0][0]=bar'],
      [{ foo: { bar: 'baz' } }, 'foo[bar]=baz'],
      [{ foo: { bar: ['baz'] } }, 'foo[bar][0]=baz'],
      [{ foo: 'bar', fizz: [['buzz']] }, 'foo=bar&fizz[0][0]=buzz'],
      [{ foo: 'fizz buzz, foo bar' }, 'foo=fizz+buzz,+foo+bar'],
    ];
    it.each(cases)(
      'builds %o into query string %s',
      (obj: object, str: string) => {
        expect(toQueryString(obj)).toBe(str);
      },
    );
    it.each(cases)(
      'parses %o from query string %s',
      (obj: object, str: string) => {
        expect(fromQueryString(str)).toEqual(obj);
      },
    );
    it.each(['__proto__', 'constructor', 'prototype'])(
      'doesnt parse %s',
      (key) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const thing: any = fromQueryString(`hello=world&${key}[fizz]=bar`);
        expect(thing).toEqual({ hello: `world` });
        expect(thing[key]?.fizz).toBeUndefined();
        expect(fromQueryString(`foo[${key}]=bar&hello=world`)).toEqual({
          foo: {},
          hello: `world`,
        });
        expect(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (fromQueryString(`foo[${key}]=bar&hello=world`) as any).foo?.[key],
        ).not.toEqual(`bar`);
        expect(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (fromQueryString(`foo[0]=test&foo[${key}]=bar&hello=world`) as any)
            .foo?.[key],
        ).not.toEqual(`bar`);
        expect(
          fromQueryString(`foo[0]=test&foo[${key}]=bar&hello=world`),
        ).toEqual({ foo: [`test`], hello: `world` });
      },
    );
  });
}
