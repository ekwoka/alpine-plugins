# X-RIAS: Responsive Images as a Service

[<img src="https://img.shields.io/npm/v/@ekwoka/x-rias?label=%20&style=for-the-badge&logo=pnpm&logoColor=white">](https://www.npmjs.com/package/@ekwoka/x-rias)
<img src="https://img.shields.io/npm/types/@ekwoka/x-rias?label=%20&amp;logo=typescript&amp;logoColor=white&amp;style=for-the-badge">
<img src="https://img.shields.io/npm/dt/@ekwoka/x-rias?style=for-the-badge&logo=npm&logoColor=white" >
[<img src="https://img.shields.io/bundlephobia/minzip/@ekwoka/x-rias?style=for-the-badge&logo=esbuild&logoColor=white">](https://bundlephobia.com/package/@ekwoka/x-rias)

> A simple Alpine Directive for use with Cloudinary Fetch API or Shopify's on the fly image processing for handling Responsive Images. Feed your Cloudinary Key (or a variety of options) into the plugin and you're off to the races.

> This is meant to be used for images that are dynamically rendered by AlpineJS, like loops through asyncronously loaded products, blog articles, etc, where conventional RESP-IMG handling becomes cumbersome.

## Install

```sh
npm i @ekwoka/x-rias
```

Import to Build (Simple Version):

```js
import Alpine from 'alpinejs';
import RIAS from '@ekwoka/x-rias';

Alpine.plugin(RIAS(CLOUDINARY_KEY)); // key used for your Cloudinary with Fetch API

window.Alpine = Alpine;
Alpine.start();
```

## Usage:

Feed a valid URL string into the `x-rias` attribute of an element, and see a nice set of responsive image URLs be fed into the `src` and `srcset` attributes of the element.

```html
input:
<img x-data x-rias="'https://placekitten.com/2000/2000'" />

output:
<img
  x-data=""
  x-rias="'https://placekitten.com/2000/2000'"
  src="https://res.cloudinary.com/CLOUD_KEY/image/fetch/f_auto,q_80,w_360/https://placekitten.com/2000/2000"
  srcset="https://res.cloudinary.com/CLOUD_KEY/image/fetch/f_auto,q_80,w_180/https://placekitten.com/2000/2000 180w,https://res.cloudinary.com/CLOUD_KEY/image/fetch/f_auto,q_80,w_360/https://placekitten.com/2000/2000 360w,
  ...
  https://res.cloudinary.com/CLOUD_KEY/image/fetch/f_auto,q_80 w_3024/https://placekitten.com/2000/2000 3024w"
  loading="lazy" />
```

It will generate URLs for every width in the array of `[180, 360, 540, 720, 900, 1080, 1296, 1512, 1728, 1944, 2160, 2376, 2592, 2808, 3024]`.

If an image has a `loading` attribute of `eager`, this will be preserved, but otherwise the `loading` attribute will be set to `lazy`. Naturally, this does not make sense to use for static above the fold images not dependent on AlpineJS to render.

## Options

In place of a simple string of your Cloudinary Fetch key, you can instead feed in an object with the following options:

| Option      | Type    | Default | Description                                                                                                                                     |
| ----------- | ------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `key`       | String  | `null`  | Your Cloudinary Fetch API key                                                                                                                   |
| `shopify`   | Boolean | `false` | If you're using Shopify's on the fly image processing, set this to `true`                                                                       |
| `maxSize`   | Number  | `null`  | The maximum width of the image to be generated in the Srcset.                                                                                   |
| `autoSizes` | Boolean | `true`  | Set true to dynamically replace the `sizes` attribute with the real pixel width of the images place in the dom. Similar to Lazysizes Autosizes. |

```js
RIASConfig = {
  shopify: true,
  maxSize: 600,
  autoSizes: true,
};
Alpine.plugin(RIAS(RIASConfig));
```

Additionally both `maxSize` and `autoSizes` can be set in the data attributes of the img element directly:

```html
<img
  x-data
  x-rias="'https://placekitten.com/2000/2000'"
  data-sizes="auto"
  data-max-size="360" />

Will output:
<img
  x-data=""
  x-rias="'https://placekitten.com/2000/2000'"
  ata-sizes="auto"
  data-max-size="360"
  src="https://res.cloudinary.com/CLOUD_KEY/image/fetch/f_auto,q_80,w_360/https://placekitten.com/2000/2000"
  srcset="
    https://res.cloudinary.com/CLOUD_KEY/image/fetch/f_auto,q_80,w_180/https://placekitten.com/2000/2000 180w,
    https://res.cloudinary.com/CLOUD_KEY/image/fetch/f_auto,q_80,w_360/https://placekitten.com/2000/2000 360w
  "
  loading="lazy"
  sizes="1000" />
```

## LocalHost

For local development, where referenced files are not accessible by Cloudinary, the RIAS is disabled and instead simply serves the local file directly. This is provided that you are using `localhost` for development. When using relative paths, the paths are coerced into absolute paths to pass to cloudinary, where the file needs to be publically accessible via url.

## Roadmap

- Give more options for controlling behaviors

## Author

👤 **Eric Kwoka**

- Website: http://thekwoka.net
- Github: [@ekwoka](https://github.com/ekwoka)

## Show your support

Give a ⭐️ if this project helped you!
