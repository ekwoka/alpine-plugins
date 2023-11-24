# Alpine History: Param Persistance for AlpineJS

[<img src="https://img.shields.io/npm/v/@ekwoka/alpine-history?label=%20&style=for-the-badge&logo=pnpm&logoColor=white">](https://www.npmjs.com/package/@ekwoka/alpine-history)
<img src="https://img.shields.io/npm/types/@ekwoka/alpine-history?label=%20&amp;logo=typescript&amp;logoColor=white&amp;style=for-the-badge">
<img src="https://img.shields.io/npm/dt/@ekwoka/alpine-history?style=for-the-badge&logo=npm&logoColor=white" >
[<img src="https://img.shields.io/bundlephobia/minzip/@ekwoka/alpine-history?style=for-the-badge&logo=esbuild&logoColor=white">](https://bundlephobia.com/package/@ekwoka/alpine-history)

> This exposes a simple magic `$query` to allow syncing and persisting values in an Alpine Component to the URL query string. This is useful for things like search forms, where you want to be able to share a link to the search results.

## Install

```sh
npm i @ekwoka/alpine-history
```

Import to Build (Simple Version):

```js
import Alpine from 'alpinejs';
import Params from '@ekwoka/alpine-history';

Alpine.plugin(Params); // key used for your Cloudinary with Fetch API

window.Alpine = Alpine;
Alpine.start();
```

## Usage:

When you want to sync a value to the URL query string, simply use the `$query` magic property when defining your Alpine component:

```html
<div
  x-data="{
  search: $query(''),
}">
  <span x-text="search"></span>
  <input type="text" x-model="search" />
</div>
```

Now you will see as you type in the input, the URL will update to include the query string `?search=your+input+here`. Refresh the page and your value will be restored! It's so easy!

You can even go back and forward in the navigation! It's like magic!

> This adds `Alpine.query` to allow this to be used in contexts that don't have Magics available, like when using `Alpine.data`.

## Options

The Query Interceptor exposes a few handy helpers to customize the behavior. These are available as methods to call after defining your initial value.

### `.as(name: string)`

By default, the query key will be the path in your component from the root until where the query is used. `as` can be used to customize the name of the query key.

```html
<div
  x-data="{
  search: $query('').as('q'),
}"></div>
```

This will now use `q` as the query key instead of `search`.

When the `$query` is nested in an object or array, the key in the query param will be visible as `key[key][key]` in the query string. This can be customized by using `as` on the parent object or array. For example:

```js
{
  search: {
    query: $query('hello'),
  },
}
```

would be `?search[query]=hello` by default.

### `.alwaysShow()`

By default, if the current value of the query is the same as the defined initial value, the query will not be shown in the URL. This can be overridden by calling `.alwaysShow()`.

```js
{
  search: $query('hello').as('q').alwaysShow(), // ?q=hello
}
```

### `.usePush()`

By default, the query will be updated using `history.replaceState` to avoid adding a new entry to the browser history. This can be overridden by calling `.usePush()`. This should be used when the query is used to handle major state changes for the user, but will likely be less useful for quickly updating minor steps.

```js
{
  episodeId: $query('').as('eid').usePush();
}
```

Whenever `episodeId` the URL will be updated with `?eid=123` and a new entry will be added to the browser history.

This plugin also implements a `popstate` listener to note when the user navigates back or forward in the browser history. This will update the value of the query to match the URL. Two way binding!

### `.into(fn: Transformer<T>)`

Naturally, query params are always strings. If you want to handle numbers or booleans, or other types, you can use the `.into` method to transform the value before it is used in your component.

```js
{
  episodeId: $query('').as('eid').into(Number);
}
```

Now, `episodeId` will be a number instead of a string when loaded from the query string.

This only handles how the value is converted from the query string. It will not affect how the value is converted to a string when updating the query string. Due to this, object types that aren't simple objects or arrays will not work as expected. Speaking of...

#### `Transformer<T>`

For TypeScript people, here's the type signature for the transformer:

```ts
type Transformer<T> = (val: T | PrimitivesToStrings<T>) => T;

type PrimitivesToStrings<T> = T extends string | number | boolean | null
  ? `${T}`
  : T extends Array<infer U>
  ? Array<PrimitivesToStrings<U>>
  : T extends object
  ? {
      [K in keyof T]: PrimitivesToStrings<T[K]>;
    }
  : T;
```

Note, the transformer will need to be able to handle being called with the type of the value or a simply parsed structure that equates to all primitives being strings. This is because the transformer will be called with the value when initializing, which can be the provided value, or the one determined from the query string.

When writing your transformer as a literal or typed function, TypeScript should help guide you to a properly formatted transformer.

Additionally, if you have an initial value that contains non-string primitives, the value of the key on the data context will resolve to `never` which should indicate, if you attempt to use it, that you need to add a transformer.

```ts
{
  episodeId: $query(123), // never
  seasonNumber: $query(1).into(Number), // number
}
```

## Arrays and Objects

This plugin supports arrays and objects as well! It will automatically treat objects and arrays as if they are made up of `$query` interceptors. For example:

```js
{
  search: $query({
    query: 'hello',
    results: ['1', '2', '3'],
  }),
}
```

will be `?search[query]=hello&search[results][0]=1&search[results][1]=2&search[results][2]=3` by default.

If you have nested primitives like booleans and numbers, you can use `.into` to transform them, but your transformer will need to handle the nested values.

```js
{
  search: $query({
    query: 'hello',
    results: [1, 2, 3],
  }).into((obj) => {
    obj.results = obj.results.map(Number);
  }),
}
```

You may choose to use separate `$query` interceptors to make this simpler.

## Reactivity

All normal reactive behaviors apply to the `$query` interceptor. You can hook up effects to them, and just have a grand old time.

## Use outside of Alpine

This Alpine plugin can actually be used outside of Alpine, though it's obviously not ideal for many reason. It's a bit of a hack, but it works!

```ts
import { QueryInterceptor } from '@ekwoka/alpine-history';

const params: Record<string, unknown> = {}; // internal object structure to store the params

const myData = {
  search: '',
};

new QueryInterceptor(
  '',
  {
    raw: <T>(v: T): T => {
      v;
    },
  },
  params,
)
  .as('q')
  .initialize(myData, 'search');
```

Not example pretty, but it works!

This can allow you to use other reactive objects, like Solid Stores. But mostly, this is a hack, but fun!

## Author

👤 **Eric Kwoka**

- Website: http://thekwoka.net
- Github: [@ekwoka](https://github.com/ekwoka)

## Show your support

Give a ⭐️ if this project helped you!
