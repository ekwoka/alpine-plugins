<h1 align="center">X-Router for AlpineJS</h1>
<p>
  <a href="https://www.npmjs.com/package/@ekwoka/x-router"><img src="https://badge.fury.io/js/@ekwoka%2Fx-router.svg" alt="npm version" height="18"></a>
  <a href="#" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
</p>

Built on top of the core `x-if` directive, `x-route` aims to simplify some of the process of having select content appear on different routes for simple Single Page Applications build with AlpineJS

```html
Before:
<template x-if="window.location.path.includes('/products')"></template>

After:
<template x-route="products"></template>
```
> Note: To enable consistent reactivity, this uses a shim for history.pushState.


## Install

```sh
npm i @ekwoka/x-router
```

## Usage

Import into your JS build as shown.

```js
import Alpine from "alpinejs"
import Router from "@ekwoka/x-router"

Alpine.plugin(Router)

window.Alpine = Alpine
Alpine.start()
```

Add `x-route` to a `<template>` tag. As with `x-if` and `x-for`, the template needs to have a single child.

For simple first level routes, just add `x-route`.

By default, these are evaluated as strings, not as reactive variables. This is for simplicity, as dynamic routes seems against the idea of a router.

```html
<template x-route></template> // root

<template x-route="products"></template>
// domain.com/products
```

To use a specific level in the route, apped `.[index]`. This can be helpful for handling nested routes.

```html
<template x-route.1="orders"></template>
// will show on domain.com/customer/orders and domain.com/account/orders

<template x-route.0="account"> // domain.com/account
  <div>
    <template x-route.1="orders"></template> // domain.com/account/orders
    <template x-route.1="settings"></template> //domain.com/account/settings
  </div>
</template>
```

To use the entire route, just append `.full` to the directive:

```html
<template x-route.full="account/orders"></template> 
// will show on domain.com/account/orders
// will not show on domain.com/account/settings or domain.com/custom/orders
```

To use a reactive variable from your Alpine component, append `.reactive` to the directive.

```html
<div x-data="{routeURL: 'account/orders'}">
  <template x-route.full.reactive="routeURL"></template>
</div>
```

Trigger page changes in a normal manner:

```js
history.pushState({},'products','/products')
```

## Known Limitations
- No support for anything that changes the current route other than `history.pushState`

## Roadmap

- Support for other methods of URL change

## Author

👤 **Eric Kwoka**

* Github: [@ekwoka](https://github.com/ekwoka)

## Show your support

Give a ⭐️ if this project helped you!