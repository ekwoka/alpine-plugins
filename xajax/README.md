<h1 align="center">Welcome to X-AJAX 👋</h1>
<p>
  <a href="https://www.npmjs.com/package/@ekwoka/x-ajax"><img src="https://badge.fury.io/js/@ekwoka%2Fx-ajax.svg" alt="npm version" height="18"></a>
  <a href="#" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
</p>

> A simple Ajax Loader for AlpineJS. Just feed it a URL, either explicitly or via a reactive Alpine expression, and watch as the content is loaded and replaced.

> At it's core, this is a replacement for using `x-html` and handling your own fetch.

## Install

```sh
npm i @ekwoka/x-ajax
```
Import to build:

```js
import Alpine from "alpinejs";
import Ajax from "@ekwoka/x-ajax"

Alpine.plugin(Ajax)

window.Alpine = Alpine;
Alpine.start();
```


## Usage
Just feed a URL into `x-ajax` and the children of that element will be replaced by that URL. So long as the expression resolved to a string that can be used in a `fetch`, you'll be golden. This can use a responsive Alpine variable to continually replace the section with new AJAX content.

```html
<div x-ajax="otherThing">...loading</div>
```

Use the modifier `query` followed by a querySelector string to find a specific element within the returned document.

```html
<div x-ajax.query.main="otherThing">...loading</div>
// will find the <main> inside the fetched resource and only use that

<div x-ajax.query.class.thingWrapper="otherThing">...loading</div>
// class modifier after query will append . to the query for class name support within the query modifier
```

When using a selector to grab multiple elements, use the modifier `all`

```html
<div x-ajax.query.class.product.all="otherThing">...loading</div>
// will find all [class="product"] elements and append them as children
```

When using a single query selector, use the modifier `replace` to destroy the `x-ajax` element and replace it with the selected element

```html
<main x-ajax.query.main.replace="otherThing">...loading</main>
// will find the <main> inside the fetched resource and replace this element with that element

```

## Roadmap
- Add actual error handling
- Add 'Children' when using a query to not use the direct selected tag, but only maintain its children

## Author

👤 **Eric Kwoka**

* Github: [@ekwoka](https://github.com/ekwoka)

## Show your support

Give a ⭐️ if this project helped you!

***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_