<script setup>
/**
 * View which will show the components to CRUD:
 *
 * /organizations/add/sites
 *  1. Sites (via Shacl-form) 
 * 
 * /organizations/add/orgs
 *  2. { FormalOrganizations, Organizations and Units} located there.
 *
 * /iss/AddSimpleReport/0 - n
 *
 * The available components, to add explicitly per route, are:
 * - Using SolidSearchField allowing to query over the Pods where these data are stored, or the "central Pod" if not distributed.
 * - Using TreeList: giving overview of linked FOrg, Org & Units, based on the filtering in the search field.
 * - Using AddResourceModal:
 *    - a AddNewSiteModal, which allows to add a site based on geolocation
 *    - a AddNewOrgModal, which allows to add a FOrg, Org, Unit, GIVEN a subOrganizationOf or hasSubOrganization parent to which to attach it.
 *
 */
</script>
<template>
  <div>Welcome to {{ $route.params }}</div>
</template>

<style lang="scss" scoped></style>
