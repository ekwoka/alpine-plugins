import { insertDotNotatedValueIntoData } from './pathresolve';

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
  });
}
