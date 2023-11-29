type StateUpdateCallback = (url: URL) => void;

const stateUpdateHandlers: StateUpdateCallback[] = [];

export const onURLChange = (callback: StateUpdateCallback) =>
  stateUpdateHandlers.push(callback);

let skip = false;
export const untrack = (cb: () => void) => {
  skip = true;
  cb();
  skip = false;
};

export const observeHistory = (
  injectHistory: Pick<History, UpdateMethod> = history,
) => {
  [UpdateMethod.replace, UpdateMethod.push].forEach((method) => {
    const original = injectHistory[method];
    injectHistory[method] = (
      data: unknown,
      title: string,
      url?: string | null,
    ) => {
      original.call(injectHistory, data, title, url);
      if (skip) return;
      stateUpdateHandlers.forEach((handler) => handler(new URL(location.href)));
    };
  });
};

export enum UpdateMethod {
  replace = 'replaceState',
  push = 'pushState',
}
