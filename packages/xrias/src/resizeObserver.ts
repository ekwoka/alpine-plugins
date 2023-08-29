const debounceObserver = <T extends Element = HTMLElement>(
  fn: (elements: Set<T>, observer: ResizeObserver) => void,
  delay: number,
): ResizeObserverCallback => {
  let timer: number | NodeJS.Timeout | null;
  const allElements = new Set<T>();
  return function (
    entries: ResizeObserverEntry[],
    observer: ResizeObserver,
  ): void {
    if (timer) clearTimeout(timer);
    entries.forEach(({ target }) => allElements.add(target as T));
    timer = setTimeout(() => {
      fn(allElements, observer);
      timer = null;
    }, delay);
  };
};

const observerCB = (els: Set<HTMLImageElement>) => {
  els.forEach((el) => resize(el));
  els.clear();
};

const resize = (el: HTMLImageElement) => {
  const setSize = (width: number) =>
    el.setAttribute('sizes', (width | 0) + 'px');
  let width = 0;
  let height = 0;
  let parent: HTMLElement | null = el;
  while (width < 100 && parent) {
    width = parent.offsetWidth;
    height = parent.offsetHeight;
    parent = parent.parentNode as HTMLElement;
  }
  const objectFit = getComputedStyle(el).objectFit;
  if (objectFit !== 'cover') return setSize(width);
  const imageRatio =
    Number(el.getAttribute('width')) / Number(el.getAttribute('height'));
  if (!imageRatio) return setSize(width);
  const displayedRatio = width / height;
  if (displayedRatio >= imageRatio + 0.1) return setSize(width);
  const newWidth = height * imageRatio;
  setSize(newWidth);
};

export const observer = new ResizeObserver(debounceObserver(observerCB, 800));
