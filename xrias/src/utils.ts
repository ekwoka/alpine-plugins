export const getURLMaker = (
  value: string,
  onShopify: boolean,
  cloudURL: string
): ((width: number) => string) => {
  if (onShopify) return getShopifyUrl(value);
  if (cloudURL) return getCloudinaryUrl(value, cloudURL);
  throw new TypeError('Invalid options');
};

export const getCloudinaryUrl = (
  value: string,
  cloudURL: string
): ((width: number) => string) => {
  value = new URL(value, document.baseURI).href;
  if (value.includes('localhost')) return () => value;
  return (v: number) => (cloudURL + value).replace('{width}', String(v));
};

export const getShopifyUrl = (value: string): ((width: number) => string) => {
  if (value.includes('{width}'))
    return (v: number) => value.replaceAll('{width}', String(v));
  if (regexp.test(value)) {
    const modified = value.replace(regexp, '_{width}x$1');
    return (v: number) => modified.replaceAll('{width}', String(v));
  }
  return (v: number) => {
    const url = new URL(value, document.baseURI);
    url.searchParams.set('width', String(v));
    return url.href;
  };
};

const regexp = /_\d+x(\.jpg|\.png)/;
