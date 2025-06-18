<template>
  <div class="vehicle-auth-view">
    <BContainer>
      <div class="mb-4">
        <h1>VA Inspector</h1>
        <p class="lead text-muted">
          Vehicle Authorization inspection and evidence management system
        </p>
      </div>

      <BRow>
        <BCol cols="12">
          <VehicleApplicationCard
            :shape-file-url="vaShapeUrl"
            form-title="Vehicle Authorization Application"
            form-description="Complete the basic vehicle authorization details. The form is dynamically loaded from the EUAR pod and will validate according to railway standards."
            container-path="VehicleAuthorisation"
            resource-name="application"
          />
        </BCol>
      </BRow>

      <!-- Future Phase 2: Evidence Manager will be added here -->
      <BRow class="mt-4">
        <BCol cols="12">
          <BCard variant="light">
            <BCardBody class="text-center text-muted">
              <h5>Evidence Management</h5>
              <p>
                Evidence linking and management functionality will be available in the next phase.
              </p>
            </BCardBody>
          </BCard>
        </BCol>
      </BRow>

      <!-- Future Phase 4: External Search will be added here -->
      <BRow class="mt-4">
        <BCol cols="12">
          <BCard variant="light">
            <BCardBody class="text-center text-muted">
              <h5>External Data Search</h5>
              <p>
                SPARQL-based external data search functionality will be available in a future phase.
              </p>
            </BCardBody>
          </BCard>
        </BCol>
      </BRow>
    </BContainer>
  </div>
</template>

<script setup>
/**
 * Vehicle Authorization View
 *
 * Main orchestrator view for the VA Inspector functionality.
 * Currently implements Phase 1: Vehicle Authorization Application form.
 * Future phases will add Evidence Management and External Search components.
 */
import { BContainer, BRow, BCol, BCard, BCardBody } from 'bootstrap-vue-next'

import VehicleApplicationCard from '@/components/vehicle/VehicleApplicationCard.vue'

// SHACL shape URL from EUAR pod for vehicle authorization applications
const vaShapeUrl =
  'https://storage.inrupt.com/ea779a2c-b43d-4723-8b1a-aaa8990dd576/process/VehicleAuthorisation/va-c2t-admin-0.0.0.1.shacl'

console.log('VehicleAuthView: Using VA shape from EUAR pod:', vaShapeUrl)
</script>

<style scoped>
.vehicle-auth-view {
  padding: 2rem 0;
}

.vehicle-auth-view .lead {
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.vehicle-auth-view h1 {
  color: var(--bs-primary);
  margin-bottom: 0.5rem;
}
</style>
