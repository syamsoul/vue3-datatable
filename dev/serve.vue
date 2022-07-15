<script lang="ts">
import { defineComponent } from 'vue';
// Uncomment import and local "components" registration if library is not registered globally.
// import { Vue3DatatableSample } from '@/entry.esm';

export default defineComponent({
  name: 'ServeDev',
  // components: {
  //  Vue3DatatableSample,
  // }
});
</script>

<template>
  <div id="app">
    <vue3-datatable-sample />
  </div>
</template>
