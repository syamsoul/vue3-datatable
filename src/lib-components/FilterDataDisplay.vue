<script setup>
// require fontawesome 6
import { onMounted, reactive, nextTick, ref } from 'vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
library.add(faTimes);


const props = defineProps({
    filterBox: Object,
    dataTable: Object
});

const filterData = ref({});

onMounted(()=>{
    refreshData();
});

const cancelFilter = function(){
    props.filterBox.clear();
    props.dataTable.fetchData(1, {});
    filterData.value = {};
};

const refreshData = function(){
    if(props.filterBox != null){
        filterData.value = props.filterBox.getDataForView();
    }
};

defineExpose({
    refreshData
});
</script>
<template>
    <div v-if="Object.keys(filterData).length > 0" class="text-xs text-gray-500">
        Filter:
        <div class="inline-block">
            <ul class="list-none">
                <li v-for="(field_value, field_name) in filterData" class="inline-block py-0.5 px-1 bg-yellow-100 mr-1 mb-0.5 rounded">
                    <span class="font-semibold">{{field_name}}:</span> '{{field_value}}'
                </li>
            </ul>
        </div>
        <div class="py-1">
            <button type="button" class="px-1 py-0.5 text-xs hover:bg-red-700 bg-red-600 border-transparent text-white opacity-70 px-4 py-2 text-sm inline-flex items-center justify-center rounded-md border font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto focus:ring-indigo-500" @click="cancelFilter">
                <FontAwesomeIcon icon="fa fa-times" class="mr-1" /> Remove Filter
            </button>
        </div>
    </div>
</template>
