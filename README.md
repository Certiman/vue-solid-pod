# vue-solid-pod

This web application reproduces the [SOLID POD Tutorial App](https://docs.inrupt.com/developer-tools/javascript/client-libraries/tutorial/getting-started/#) using the vite & vue3 starter template. The intention is to demo how Solid pods can easily be integrated into Vue3 apps.

## Main objectives

- [X] Reproduce the POD tutorial app (all functions) using a front-end framework.
- [X] Use reactive components in order to collect and visualize the reading List (items). 
- [X] Allow for the removal of the book items and update the Pod.
- [X] Additionally, allow for downloading the existing reading List FROM the POD and update the UI.
- [X] Also, allow for SHACL-FORM based input of a new book, and append the data into the data resource for the reading List.
- [ ] For books added via the SHACL-FORM, allow for a Solid Pod based delete.
- [ ] For existing books, allow for a pre-filled form in order to complement them.

Some technical details are discussed [here](./src/shapes/addition.md).

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

Not recommended.

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
