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
import Alpine from 'alpinejs';
import Ajax from '@ekwoka/x-ajax';

Alpine.plugin(Ajax);

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
// will find the
<main>
  inside the fetched resource and only use that

  <div x-ajax.query.class.thing-wrapper="otherThing">...loading</div>
  // class modifier after query will append . to the query for class name support within the query modifier
</main>
```

When using a selector to grab multiple elements, use the modifier `all`

```html
<div x-ajax.query.class.product.all="otherThing">...loading</div>
// will find all [class="product"] elements and append them as children
```

When using a single query selector, use the modifier `replace` to destroy the `x-ajax` element and replace it with the selected element

```html
<main x-ajax.query.main.replace="otherThing">...loading</main>
// will find the
<main>inside the fetched resource and replace this element with that element</main>
```

## Halting Fetch

If you want to prevent the fetch from happening until a future time (while not wrapping the element in an `x-if`), you can have the expression resolve to any falsy value (`false`, `null`, `undefined`, `0`, `""`, `NaN`). This will not trigger the fetch and replace.

```html
<div x-ajax="ready ? myAwesomeURL : false">Waiting</div>
```

This will trigger an event on the element accessible at `@halted` for debugging purposes.

## Error Handling and Events

`x-ajax` mimics the native object replacement API and emits two events on the element: `load` and `error`.

Naturally, `error` fires if there was any error in the process, most likely to be a network error, but will also fire if `x-ajax` cannot find the elements in the returned document. `load` fires after the network call and parsing, but before actually swapping the dom elements, which generally is incapable of producing an error. As such, these events can be accessed with alpine as so:

```html
<div x-ajax.replace="myCoolURL" @load="success = true" @error="error = $event.detail"></div>
```

These can be used to change the url to a fallback, or to display an error message.

## Roadmap

- Add 'Children' when using a query to not use the direct selected tag, but only maintain its children

## Author

👤 **Eric Kwoka**

- Github: [@ekwoka](https://github.com/ekwoka)

## Show your support

Give a ⭐️ if this project helped you!

---

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
