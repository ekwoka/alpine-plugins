import { PluginCallback, ReactiveEffect } from 'alpinejs';

export const window: PluginCallback = (Alpine) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const windowMap = new WeakMap<any[], AlpineWindow<any>>();

  class AlpineWindow<T> {
    list: T[];
    value: { value: string | null } = Alpine.reactive({ value: null });
    valueGetter: () => string = (() => {}) as () => string;
    transformer: (value: T) => string = () => '';
    constructor(list: T[]) {
      this.list = list;
    }
    withValue = (valueGetter: () => string) => {
      this.valueGetter = valueGetter;
      return this;
    };
    withTransformer = (transformer: (value: T) => string) => {
      this.transformer = transformer;
      return this;
    };
    initialized = false;
    cleanup = () => {};
    reactiveKeys: { [key: string]: boolean } = Alpine.reactive({});
    keyEffect: ReactiveEffect | null = null;
    get(key: string) {
      return this.reactiveKeys[key] ?? false;
    }
    setup = () => {
      if (this.initialized) return this;
      this.initialized = true;
      const effects: ReactiveEffect[] = [];
      if (this.valueGetter)
        effects.push(
          Alpine.effect(() => {
            this.value.value = this.valueGetter();
          }),
        );
      if (this.transformer)
        effects.push(
          Alpine.effect(() => {
            this.list.forEach((item) => {
              this.reactiveKeys[this.transformer(item)] = false;
            });
          }),
        );
      let prevValue: string | null = null;
      effects.push(
        Alpine.effect(() => {
          this.reactiveKeys[prevValue ?? 'null'] = false;
          this.reactiveKeys[(prevValue = this.value.value ?? 'null')] = true;
        }),
      );
      return this;
    };
  }

  const $window = <T>(list: T[]) => {
    if (windowMap.has(list)) return windowMap.get(list) as AlpineWindow<T>;
    const window = new AlpineWindow(list);
    windowMap.set(list, window);
    return window;
  };
  Alpine.magic('window', () => $window);
};

export default window;
