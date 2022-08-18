const debounceObserver = <F extends ResizeObserverCallback>(
  fn: F,
  delay: number
): ResizeObserverCallback => {
  let timer: number;
  return function (
    entries: ResizeObserverEntry[],
    observer: ResizeObserver
  ): void {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(entries, observer);
      timer = null;
    }, delay);
  };
};

const observerCB: ResizeObserverCallback = (entries) => {
  entries.forEach(({ target }) => resize(target as HTMLElement));
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
