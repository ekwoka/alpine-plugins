import { Alpine } from 'alpinejs';

export default function (Alpine: Alpine) {
  Alpine.directive(
    'ajax',
    (el: Element, { expression, modifiers }, { effect, evaluateLater }) => {
      const target = evaluateLater<string>(expression);
      let query = '';

      if (modifiers.includes('query'))
        query =
          modifiers[
            modifiers.indexOf(modifiers.includes('class') ? 'class' : 'query') +
              1
          ];
      if (modifiers.includes('class')) query = '.' + query;

      (effect as (fn: () => void) => void)(() => {
        target(async (target: string) => {
          if (!target)
            return el.dispatchEvent(
              new CustomEvent('halted', {
                detail: 'Target is not defined',
                ...eventDefaults,
              }),
            );
          const content = await fetchHTML(target);
          if (content instanceof CustomEvent) return el.dispatchEvent(content);
          const doc = parseDom(content);
          if (doc instanceof CustomEvent) return el.dispatchEvent(doc);
          const selector = query
            ? modifiers.includes('all')
              ? doc.body.querySelectorAll(query)
              : doc.body.querySelector(query)
            : doc.body;
          if (!selector) throw new Error('Selected element not found');

          el.dispatchEvent(new Event('load', eventDefaults));
          if (selector instanceof NodeList) {
            if (modifiers.includes('all'))
              return el.replaceChildren(...selector);
          } else {
            if (modifiers.includes('replace')) return el.replaceWith(selector);
            if (selector.tagName == 'BODY')
              return el.replaceChildren(...selector.children);
            return el.replaceChildren(selector);
          }
        });
      });
    },
  );
}

const eventDefaults = {
  bubbles: false,
};

const fetchHTML = async (url: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(response.statusText);
    return await response.text();
  } catch (e) {
    console.error(e);
    return new CustomEvent('error', { detail: e, ...eventDefaults });
  }
};

const xParser = new DOMParser();
const parseDom = (html: string) => {
  try {
    return xParser.parseFromString(html, 'text/html');
  } catch (e) {
    console.error(e);
    return new CustomEvent('error', { detail: e, ...eventDefaults });
  }
};
