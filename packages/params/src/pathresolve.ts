export const objectAtPath = (
  keys: string[],
  data: Record<string, unknown>,
  final?: string,
) => {
  while (keys.length) {
    const key = keys.shift()!;
    if (isForbidden(key)) return null;

    // This is where we fill in empty arrays/objects allong the way to the assigment...
    if (data[key] === undefined)
      data[key] = isNaN(Number(keys[0] ?? final)) ? Object.create({}) : [];
    data = data[key] as Record<string, unknown>;
    // Keep deferring assignment until the full key is built up...
  }
  return data;
};

export const insertDotNotatedValueIntoData = (
  path: string,
  value: unknown,
  data: Record<string, unknown>,
) => {
  const keys = path.split('.');
  const final = keys.pop()!;
  const interimdata = objectAtPath(keys, data, final);
  return !interimdata || isForbidden(final)
    ? undefined
    : (interimdata[final] = value);
};

export const retrieveDotNotatedValueFromData = (
  path: string,
  data: Record<string, unknown>,
) => {
  const keys = path.split('.');
  const final = keys.pop()!;
  const interimdata = objectAtPath(keys, data, final);
  return !interimdata || isForbidden(final) ? undefined : interimdata[final];
};

export const deleteDotNotatedValueFromData = (
  path: string,
  data: Record<string, unknown>,
) => {
  const keys = path.split('.');
  const final = keys.pop()!;
  const interimdata = objectAtPath(keys, data, final);
  if (interimdata && !isForbidden(final)) delete data[final];
};

if (import.meta.vitest) {
  describe('Object Path Resolution', () => {
    const data = { foo: { fizz: 'buzz', bar: { qwux: 'quuz' } } };
    it.each([
      [['foo'], data.foo],
      [['foo', 'bar'], data.foo.bar],
      [['foo', 'fizz'], data.foo.fizz],
    ])('object at path %s is %s', (path, expected) => {
      expect(objectAtPath(path, data)).toBe(expected);
    });
    it.each([
      ['foo', data.foo],
      ['foo.bar', data.foo.bar],
      ['foo.fizz', data.foo.fizz],
    ])('value at path %s is %o', (path, expected) => {
      expect(retrieveDotNotatedValueFromData(path, data)).toBe(expected);
    });
    it.each([
      ['foo', 'hello'],
      ['foo.bar', [1, 2]],
      ['foo.fizz', { hello: 'world' }],
    ])('value at path %s is %o', (path, toInsert) => {
      const innerdata = structuredClone(data);
      insertDotNotatedValueIntoData(path, toInsert, innerdata);
      expect(retrieveDotNotatedValueFromData(path, innerdata)).toBe(toInsert);
    });
  });
}

export const isForbidden = (key: string) => forbiddenKeys.includes(key);
const forbiddenKeys = ['__proto__', 'constructor', 'prototype'];
