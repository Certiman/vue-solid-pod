<script setup>
import { store } from '../stores/store'

</script>

<template>
  <!-- <span v-b-color-mode="store.mode"> -->
  <h1>About this application</h1>
  <p>
    This web app converted the
    <a href="https://docs.inrupt.com/developer-tools/javascript/client-libraries/tutorial/getting-started/">Solid App
      JS</a>
    to a Vue3 SPA.
  </p>
  <p>
    Opinionated additions:
  <ul>
    <li>Allows for individual books to be added sequentially instead of via a <code>textfield</code>.</li>
    <li>Allows for the book list to be stored in a named <code>ldp:RDFSource</code> instead of always <code>myList</code>.</li>
    <li>
      Allows for logging in by reusing a session login before as described 
      <a
        href="https://docs.inrupt.com/developer-tools/javascript/client-libraries/tutorial/restore-session-browser-refresh/">here</a>.
    </li>
    <li>Allows for subscribing to a <code>ldp:RDFResource</code> by using the <code>Websocket Notification</code> as described <a href="https://docs.inrupt.com/developer-tools/javascript/client-libraries/tutorial/subscribe-to-notifications/">here</a></li>
    <li>A bit of overkill on the <a href="https://iconify.design/">icons</a></li>
    <li>
      We went full in on using
      <a href="https://bootstrap-vue-next.github.io/bootstrap-vue-next/" class="hre">the excellent BootstrapVueNext</a>
      library, respecting the original layout nevertheless.
    </li>
  </ul>
  </p>
<!-- </span> -->
</template>

<style>
/* @media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
} */
</style>
