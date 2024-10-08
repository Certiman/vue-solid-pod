<script setup>
/**
 * Component receives:
 * { "http://www.w3.org/ns/solid/acp#PublicAgent": { "read": true, "append": true, "write": false, "controlRead": false, "controlWrite": false }, "https://id.inrupt.com/euarpod": { "read": true, "append": true, "write": true, "controlRead": false, "controlWrite": false } }
 *
 * Creates list:
 * Agent | inline radio buttons
 */
import { ref } from 'vue'

const props = defineProps({ allRights: Object })
const allRightsIn = ref(Object.entries(props.allRights))
</script>
<template>
  <BContainer v-if="allRightsIn.length>0">
    <AccessRightsItem
      v-for="[owner, rights] of allRightsIn"
      :key="owner"
      :rights-in="rights"
      :rights-owner="owner"
    />
  </BContainer>
  <p v-else>No rights found or attributed to other agents.</p>
</template>

<style lang="scss" scoped></style>
