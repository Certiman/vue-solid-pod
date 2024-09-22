<script setup>
/**
 * Path: /profile/:action/[sites|org]
 * Target: FROM POD PrivateType stgh for class:Org!
 *
 * Supported :action: [add|delete|update]
 *
 * Example:
 * /profile/add/sites: Sites (via Shacl-form)
 * /profile/add/orgs:  { FormalOrganizations, Organizations and Units} located there.
 *
 */
</script>

<template>
  <h5>Profile manager redirect (debug)</h5>
  <div>Parameters: {{ $route.params }}</div>
  <div>Route query object: {{ $route.query }}</div>
</template>

<style lang="scss" scoped></style>
