import { Alpine, ElementWithXAttributes } from 'alpinejs';

const pushState = history.pushState.bind(history);
const routeEvent = new Event('x-route');

history.pushState = function (a, b, c) {
  pushState(a, b, c);
  setRoute();
};

function setRoute() {
  let path = window.location.pathname.split('/');
  path = path.filter(String);
  window._x_route = path;
  window.dispatchEvent(routeEvent);
}

setRoute();

export default function (Alpine: Alpine) {
  Alpine.directive(
    'route',
    (el, { expression, modifiers }, { evaluateLater, cleanup }) => {
      if (!isTemplate(el))
        return console.error(el, 'x-route only works on template elements');
      const index = typeof modifiers[0] == 'number' ? modifiers[0] : 0;
      const leftSide = modifiers.includes('full')
        ? 'window._x_route.join("/")'
        : `window._x_route[${index}]`;
      const rightSide = modifiers.includes('reactive')
        ? expression
        : `'${expression}'`;

      expression = expression
        ? `${leftSide}==${rightSide}`
        : 'window._x_route.length===0';
      const evaluate = evaluateLater(expression);

      const show = () => {
        if (el._x_currentRouteEl) return el._x_currentRouteEl;

        const clone = el.content.firstElementChild?.cloneNode(
          true,
        ) as ElementWithXAttributes;
        if (!clone) return console.error('No element found in template', el);

        Alpine.addScopeToNode(clone, {}, el);

        Alpine.mutateDom(() => {
          el.after(clone);
          Alpine.initTree(clone);
        });

        el._x_currentRouteEl = clone;

        el._x_undoRoute = () => {
          clone.remove();
          delete el._x_currentRouteEl;
        };

        return clone;
      };

      const hide = () => {
        if (!el._x_undoRoute) return;

        el._x_undoRoute();

        delete el._x_undoRoute;
      };

      evaluate((value) => {
        value ? show() : hide();
      });

      const routeListener = () =>
        evaluate((value) => {
          value ? show() : hide();
        });
      window.addEventListener('x-route', routeListener);
      el._x_removeRouter = () =>
        window.removeEventListener('x-route', routeListener);

      cleanup(() => {
        el._x_undoRoute?.();
        el._x_removeRouter?.();
        delete el._x_undoRoute;
        delete el._x_removeRouter;
      });
    },
  );
}

declare module 'alpinejs' {
  interface XAttributes {
    _x_undoRoute: () => void;
    _x_removeRouter: () => void;
    _x_currentRouteEl?: HTMLElement;
  }
}

declare global {
  interface Window {
    _x_route: string[];
  }
}

const isTemplate = (
  el: Element,
): el is ElementWithXAttributes<HTMLTemplateElement> =>
  el instanceof HTMLTemplateElement;
