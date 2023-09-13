import { Alpine } from 'alpinejs';
import { observer } from './resizeObserver.js';
import { getURLMaker, makeSrcSet } from './utils.js';

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
      (el, { expression }, { effect, evaluateLater, cleanup }) => {
        if (!(el instanceof HTMLImageElement))
          return console.warn('x-rias only works on img elements');
        cleanup(() => observer.unobserve(el));
        if (!expression) return autoSize && observer.observe(el);
        const evaluate = evaluateLater(expression);

        (effect as (fn: () => void) => void)(() => {
          evaluate((value: string) => {
            if (!value || typeof value !== 'string') return;
            const makeImg = getURLMaker(value, shopify, cloudURL);
            const max = maxSize || Number(el.dataset.maxSize) || Infinity;

            const src = makeImg(Math.min(max, 360));
            const srcset = makeSrcSet(makeImg, max);
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

    const $rias = {
      srcset(value: string) {
        return makeSrcSet(
          getURLMaker(value, shopify, cloudURL),
          maxSize || Infinity,
        );
      },
      observe: observer.observe.bind(observer),
      unobserve: observer.unobserve.bind(observer),
    };

    Alpine.magic('rias', () => $rias);
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
