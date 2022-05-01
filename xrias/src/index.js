const regexp = /_\d+x(\.jpg|\.png)/;
const observer = new ResizeObserver(debounceObserver(observerCB,800));

let cloudURL, key, autoSize, shopify, maxSize;

export default function (OPTIONS) {
  if (typeof OPTIONS === 'string') cloudURL = `https://res.cloudinary.com/${OPTIONS}/image/fetch/f_auto,q_80,w_{width}/`;
  if (typeof OPTIONS === 'object') {
    ({ key, autoSize, shopify, maxSize } = OPTIONS);
    if (key) cloudURL = `https://res.cloudinary.com/${key}/image/fetch/f_auto,q_80,w_{width}/`;
  }


  return (Alpine) => {
    Alpine.directive('rias', (el, { expression }, { effect, evaluateLater }) => {
      let evaluate = evaluateLater(expression);

      effect(() => {
        evaluate((value) => {
          if(!value || typeof value !== 'string') return;
          let imgBase = getBaseUrl(value);
          if (!imgBase.includes('{width}')) return (el.src = imgBase)

          let widths = [180, 360, 540, 720, 900, 1080, 1296, 1512, 1728, 1944, 2160, 2376, 2592, 2808, 3024]
          widths = (maxSize || el.dataset.maxSize) ? widths.filter(w=>w<=(maxSize || el.dataset.maxSize)) : widths;
          let src = imgBase.replaceAll('{width}', widths[1]||widths[0]);
          let srcset = widths.map((w) => `${imgBase.replaceAll('{width}', w)} ${w}w`).join(',');

          Alpine.mutateDom(() => {
            el.src = src;
            el.srcset = srcset;
            el.loading = el.loading == 'eager' ? 'eager' : 'lazy';
            if (autoSize || el.dataset.sizes=='auto') observer.observe(el);
          });
        });
      });
    });
  };
}

function getBaseUrl(value) {
  if (shopify) return getShopifyUrl(value);
  return getCloudinaryUrl(value);
}

function getCloudinaryUrl(value) {
  value = new URL(value, document.baseURI).href;
  if (value.includes('localhost')) return value;
  return cloudURL + value;
}

function getShopifyUrl(value) {
  if (value.includes('{width}')) return value;
  if (regexp.test(value)) return value.replace(regexp,'_{width}x$1');
  return value.replace(/.jpg|.png/g, `_{width}x$&`);
}

function resize(el) {
  let sizes = el.offsetWidth;
  let parent = el.parentNode;
  while (sizes < 100 && parent) {
    sizes = parent.offsetWidth;
    parent = parent.parentNode;
  }
  sizes += 'px';
  el.setAttribute('sizes', sizes);
}

function debounceObserver(fn,delay) {
  let timer;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  }
}

function observerCB(entries) {
  entries.forEach(({ target }) => resize(target));
}