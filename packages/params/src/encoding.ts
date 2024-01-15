export type Encoding<T> = {
  to(value: T): PrimitivesToStrings<T>;
  from(value: PrimitivesToStrings<T>): T;
};

export type PrimitivesToStrings<T> = T extends string | number | boolean | null
  ? `${T}`
  : T extends Array<infer U>
    ? Array<PrimitivesToStrings<U>>
    : T extends object
      ? {
          [K in keyof T]: PrimitivesToStrings<T[K]>;
        }
      : T;

globalThis.btoa ??= (str: string) => Buffer.from(str).toString('base64');
globalThis.atob ??= (str: string) => Buffer.from(str, 'base64').toString();

export const base64: Encoding<string> = {
  to: (value) => btoa(value),
  from: (value) => atob(value),
};

export const base64URL: Encoding<string> = {
  to: (value) =>
    btoa(value).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', ''),
  from: (value) => atob(value.replaceAll('-', '+').replaceAll('_', '/')),
};

if (import.meta.vitest) {
  describe('Encoding', () => {
    it('should encode and decode base64', () => {
      expect(base64.to('hello world')).toBe('aGVsbG8gd29ybGQ=');
      expect(base64.to('<<???>>')).toBe('PDw/Pz8+Pg==');
      expect(base64.from('aGVsbG8gd29ybGQ=')).toBe('hello world');
      expect(base64.from('PDw/Pz8+Pg==')).toBe('<<???>>');
    });
    it('should encode and decode base64URL', () => {
      expect(base64URL.to('hello world')).toBe('aGVsbG8gd29ybGQ');
      expect(base64URL.to('<<???>>')).toBe('PDw_Pz8-Pg');
      expect(base64URL.from('aGVsbG8gd29ybGQ')).toBe('hello world');
      expect(base64URL.from('PDw_Pz8-Pg')).toBe('<<???>>');
    });
  });
}
