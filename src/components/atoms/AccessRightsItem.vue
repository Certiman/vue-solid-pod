<script setup>
import { ref } from 'vue'

const props = defineProps({ rightsIn: Object, rightsOwner: String })

const resRights = ref(props.rightsIn)
const rights = Object.keys(resRights.value)
const resWebId = ref(props.rightsOwner)
const state = ref(true)
</script>
<template>
  <BRow>
    <BCol> <BFormInput id="webIdAcl" v-model="resWebId" :state="state" :disabled="true" /> </BCol>
    <BCol>
      <BFormCheckbox
        v-for="(right, i) in rights"
        :key="i"
        switch
        inline
        v-model="resRights[right]"
        :disabled="true"
        >{{ right }}</BFormCheckbox
      >
    </BCol>
  </BRow>
</template>

<style lang="scss" scoped></style>
