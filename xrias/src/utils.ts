export const getBaseUrl = (
  value: string,
  onShopify: boolean,
  cloudURL: string
): string => {
  if (onShopify) return getShopifyUrl(value);
  if (cloudURL) return getCloudinaryUrl(value, cloudURL);
  throw new TypeError('Invalid options');
};

export const getCloudinaryUrl = (value: string, cloudURL: string): string => {
  value = new URL(value, document.baseURI).href;
  if (value.includes('localhost')) return value;
  return cloudURL + value;
};

export const getShopifyUrl = (value: string): string => {
  if (value.includes('{width}')) return value;
  if (regexp.test(value)) return value.replace(regexp, '_{width}x$1');
  return value.replace(/.jpg|.png/g, `_{width}x$&`);
};

const regexp = /_\d+x(\.jpg|\.png)/;
