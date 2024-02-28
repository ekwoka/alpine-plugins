# Alpine Scope: Scoped Context Naming for AlpineJS

[<img src="https://img.shields.io/npm/v/@ekwoka/alpine-scope?label=%20&style=for-the-badge&logo=pnpm&logoColor=white">](https://www.npmjs.com/package/@ekwoka/alpine-scope)
<img src="https://img.shields.io/npm/types/@ekwoka/alpine-scope?label=%20&amp;logo=typescript&amp;logoColor=white&amp;style=for-the-badge">
<img src="https://img.shields.io/npm/dt/@ekwoka/alpine-scope?style=for-the-badge&logo=npm&logoColor=white" >
[<img src="https://img.shields.io/bundlephobia/minzip/@ekwoka/alpine-scope?style=for-the-badge&logo=esbuild&logoColor=white">](https://bundlephobia.com/package/@ekwoka/alpine-scope)

> This exposes a simple magic `$scope` to allow accessing specific component scopes in the tree by name.

## Install

```sh
npm i @ekwoka/alpine-scope
```

Import to Build (Simple Version):

```js
import Alpine from 'alpinejs';
import Scope from '@ekwoka/alpine-scope';

Alpine.plugin(Scope);

window.Alpine = Alpine;
Alpine.start();
```

## Usage:

When using Alpine, it can sometimes be difficult to access the values you want in some component trees. While often this is a case of poor design, sometimes the best design can still run into some conflicts that require awkward workarounds.

With this plugin, you can use the magic `$scope` to directly access the data context of a specific component in the tree.

### Implicit Naming

```html
<div x-data="foo">
  // { value: 'hello' }
  <div x-data="bar">
    // { value: 'world' }
    <span x-text="$scope.foo.value"></span> // 'hello'
    <span x-text="value"></span> // 'world'
  </div>
</div>
```

The above is an example of implicitely scoped contexts. The expression passed to `x-data` is used as the key. This works great when the contexts are defined with `Alpine.data` and referenced by name. Obviously, this would become an issue if you your expression is like

```html
<div
  x-data="{ foo: { bar: [1,2,3 ]}, doStuff() { console.log(this.foo.bar) } }"></div>
```

### Explicit Naming

Conveniently included is the `x-scope` directive, which allows you to explicitly name the scope. This is useful for cases where the expression may be unknown at the point of needing the scoping, and cases where the expression is unwieldly.

```html
<div x-data="{ value: 'hello' }" x-scope="foo">
  <div x-data="{ value: 'world' }">
    <span x-text="$scope.foo.value"></span> // 'hello'
    <span x-text="value"></span> // 'world'
  </div>
</div>
```

Pretty nifty!!!

And don't worry, scopes won't leak into other trees. They are only accessible within the tree they are defined.

## How it works

### `x-scope="expression"`

`x-scope` adds a `Map` of scopes to the current elements nearest component, that contains any scopes from the parent component and then the current component. These are placed in the context under a special `Symbol` so as not to conflict with your components directly.

This adds the scope to the current context, not the specific elements subtree. This means that children of the `root` element can provide a name to the scope, and that all elements in the component will see the same list of scopes, even if they are not in the same subtree. This can be useful for some more dynamic use cases. The same component scope can be named multiple times from multiple `x-scope` directives in the component tree, and they will not remove the others.

However, the scopes are isolated to the component and its decendents, and will not leak into the parent or other components.

### `$scope.name`

`$scope` is a magic property available in expressions and component methods that exposes a `Proxy` that allows access to the Parent components.

When a key is access, like `$scope.foo`, the `Proxy` first looks in the current contexts `Map` of scopes (from `x-scope`) for a context. If no context is found, it will look up the tree for an element with a matching `x-data` expression to use its context.

This means that explicitely named scopes will always take precedence over implicitely named scopes, and that scopes will not leak to sibling or parent trees.

## Author

👤 **Eric Kwoka**

- Website: http://thekwoka.net
- Github: [@ekwoka](https://github.com/ekwoka)

## Show your support

Give a ⭐️ if this project helped you!
