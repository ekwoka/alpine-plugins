const debounceObserver = (
  fn: (elements: Set<HTMLElement>, observer: ResizeObserver) => void,
  delay: number,
): ResizeObserverCallback => {
  let timer: number;
  const allElements = new Set<HTMLElement>();
  return function (
    entries: ResizeObserverEntry[],
    observer: ResizeObserver,
  ): void {
    if (timer) clearTimeout(timer);
    entries.forEach(({ target }) => allElements.add(target as HTMLElement));
    timer = setTimeout(() => {
      fn(allElements, observer);
      timer = null;
    }, delay);
  };
};

const observerCB = (els: Set<HTMLElement>) => {
  els.forEach((el) => resize(el));
};

const resize = (el: HTMLElement) => {
  let sizes = el.offsetWidth;
  let parent = el.parentNode as HTMLElement;
  while (sizes < 100 && parent) {
    sizes = parent.offsetWidth;
    parent = parent.parentNode as HTMLElement;
  }
  el.setAttribute('sizes', sizes + 'px');
};

export const observer = new ResizeObserver(debounceObserver(observerCB, 800));
