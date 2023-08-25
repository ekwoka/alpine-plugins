import { Alpine } from 'alpinejs';
import { observer } from './resizeObserver.js';
import { getURLMaker } from './utils.js';

export default function (OPTIONS: Config) {
  const {
    autoSize = true,
    shopify = false,
    maxSize = 0,
    cloudURL = '',
  } = parseOptions(OPTIONS) ?? {};

  return (Alpine: Alpine) => {
    Alpine.directive(
      'rias',
      (el: HTMLImageElement, { expression }, { effect, evaluateLater }) => {
        if (!expression) return autoSize && observer.observe(el);
        const evaluate = evaluateLater(expression);

        (effect as (fn: () => void) => void)(() => {
          evaluate((value: string) => {
            if (!value || typeof value !== 'string') return;
            const makeImg = getURLMaker(value, shopify, cloudURL);

            const widths = [
              180, 360, 540, 720, 900, 1080, 1296, 1512, 1728, 1944, 2160, 2376,
              2592, 2808, 3024,
            ].filter(
              (w) =>
                !(maxSize || el.dataset.maxSize) ||
                w <= (maxSize || Number(el.dataset.maxSize)),
            );
            const src = makeImg(widths[1] || widths[0]);
            const srcset = widths.map((w) => `${makeImg(w)} ${w}w`).join(',');
            Alpine.mutateDom(() => {
              el.src = src;
              el.srcset = srcset;
              el.loading = el.loading == 'eager' ? 'eager' : 'lazy';
              if (autoSize || el.dataset.sizes == 'auto') observer.observe(el);
            });
          });
        });
      },
    );
  };
}

const parseOptions = (OPTIONS: Config) => {
  if (typeof OPTIONS === 'string') {
    const cloudURL = `https://res.cloudinary.com/${OPTIONS}/image/fetch/f_auto,q_80,w_{width}/`;
    return { cloudURL };
  }
  if (typeof OPTIONS === 'object') {
    return {
      ...OPTIONS,
      cloudURL: OPTIONS.key
        ? `https://res.cloudinary.com/${OPTIONS.key}/image/fetch/f_auto,q_80,w_{width}/`
        : '',
    };
  }
};

type Config =
  | {
      key?: string;
      autoSize?: boolean;
      shopify?: boolean;
      maxSize?: number;
    }
  | CloudinaryKey;

type CloudinaryKey = string;
