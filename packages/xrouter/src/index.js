import { addScopeToNode } from "alpinejs/src/scope";
import on from "alpinejs/src/utils/on";

const pushState = history.pushState.bind(history);
const routeEvent = new Event("x-route");

history.pushState = function (a, b, c) {
  pushState(a, b, c);
  setRoute();
};

function setRoute() {
  let path = window.location.pathname.split("/");
  path = path.filter(String)
  window._x_route = path;
  window.dispatchEvent(routeEvent);
}

setRoute()

export default function (Alpine) {
  Alpine.directive(
    "route",
    (el, { expression, modifiers }, { evaluateLater, cleanup }) => {
      let index = typeof (modifiers[0])=='number'?modifiers[0]:0
      let leftSide = modifiers.includes('full')?'window._x_route.join("/")':`window._x_route[${index}]`
      let rightSide = modifiers.includes('reactive')?expression:`'${expression}'`

      expression = expression?`${leftSide}==${rightSide}`:'window._x_route.length===0';
      let evaluate = evaluateLater(expression);

      let show = () => {
        if (el._x_currentRouteEl) return el._x_currentRouteEl;

        let clone = el.content.cloneNode(true).firstElementChild;

        addScopeToNode(clone, {}, el);

        Alpine.mutateDom(() => {
          el.after(clone);
          Alpine.initTree(clone)
        });

        el._x_currentRouteEl = clone;

        el._x_undoRoute = () => {
          clone.remove();
          delete el._x_currentRouteEl;
        };

        return clone;
      };

      let hide = () => {
        if (!el._x_undoRoute) return;

        el._x_undoRoute();

        delete el._x_undoRoute;
      };

      evaluate((value) => {
        value ? show() : hide();
      });

      el._x_removeRouter = on(window, "x-route", [], () =>
      evaluate((value) => {
        value ? show() : hide();
      }));

      cleanup(() => {
          el._x_undoRoute && el._x_undoRoute()
          el._x_removeRouter && el._x_removeRouter()
          delete el._x_undoRoute;
          delete el._x_removeRouter;
      });
    }
  );
}
