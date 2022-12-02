# CHAIRS CHAIRS CHAIRS

## Things to note

- This app requires Node 16 or newer
- Cypress screenshot tests are only reliable in the same browser and OS. To make them less flaky we will need to run them in a container, otherwise platform and browser differences will cause tests to fail. For now, to preview the tests, delete the `cypress-visual-screenshots/baseline` folder before running

## Thoughts

I approached this largely like a POC that may eventually grow into a production app.

If this was a production app I would definitely write it in TypeScript. In the interest of fast iteration and avoiding the need for a bundler, we are using Javascript.

## Testing strategy:

Given that this app is very side-effect heavy, we can gain the most confidence for the drawing features from running browser tests with screenshots, then comparing the results.

There are also some Jest unit tests for the canvas functions, since those are critical to the primary functionality of the app.

## Running the app:

Open `index.html` in a browser, or `npm run serve` will start a local server.

## Running tests

`npm run test:unit` will run Jest tests (at the moment mainly "unit" in nature, but will expand to include "integration" tests between different modules in the future)

`npm run test:browser` will run Cypress tests

## Development

`npm run dev` starts browsersync and watches `index.html`, `index.js`, `style.css` and all files in `/src`, and will automatically reload your browser when any change occurs in those files.

`npm run test:unit:watch` will start Jest in watch mode, useful when developing tests

`npm run test:browser` will run Cypress tests in headed browser mode, while watching test files for changes.

## TODO/Roadmap:

- [ ] Jest tests for store hydration/saving from/to localStorage
- [ ] Jest tests for DOM functions like renderAllAnnotations, renderGallery
- [ ] Cypress tests for localStorage persistence
- [ ] Check local storage space and flag when running out of space
- [ ] Don't allow move box outside of canvas boundaries
- [ ] Upload multiple images
- [ ] Use IndexedDB for more storage
- [ ] Ability to resize box (use isPointInStroke)
- [ ] Ability to set annotation colours
- [ ] Replace generic `confirm` with a proper styled modal dialog
- [ ] Undo delete annotations
- [ ] Undo delete images
- [ ] Load a set of dummy data
