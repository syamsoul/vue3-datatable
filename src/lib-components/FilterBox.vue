<script setup>
// require fontawesome 6
import { onBeforeMount, reactive, nextTick, ref } from 'vue';
import { TransitionChild, TransitionRoot } from '@headlessui/vue';
import LitepieDatepicker from 'litepie-datepicker-tw3';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
library.add(faSpinner, faXmark, faFilter, faSearch);

const emit = defineEmits(['formReady', 'submitForm']);

const props = defineProps({
    fields: {type:Array, default: []},
    dataTable: Object,
    filterDataDisplay: Object,
});

const data = reactive({
    is_modal_hidden:true,
    form: {
        data: {},
        processing: false,
    },
    new_fields: {},
});
const datePickerRefs = reactive([]);
const datePickerSeparator = " ~ ";

onBeforeMount(async ()=>{
    setNewFields();
    await nextTick();
    await resetField();

    props.dataTable.fetchData(1, getData(), ()=>{
        props.filterDataDisplay.refreshData();
    });

    emit('formReady', {
        getData,
        getDataForView,
        form: data.form,
        hideModal,
    });
});

const submit = function(){
    data.form.processing = true;

    props.dataTable.fetchData(1, getData(), (res)=>{
        data.form.processing = false;
        props.filterDataDisplay.refreshData();
        hideModal();
    });

    emit('submitForm', {
        getData,
        getDataForView,
        form: data.form,
        hideModal,
    });
};

const resetField = async function(){
    let index = 0;
    for(let fieldName in data.new_fields){
        let item = data.new_fields[fieldName];

        await nextTick();

        data.form.data[fieldName] = item.default;
        item.enable = item.defaultEnable;

        if(item.type == 'datepicker'){
            if(typeof datePickerRefs[index] == 'undefined') datePickerRefs[index] = ref(null);
            await nextTick();

            //datePickerRefs[index].value.pickerValue = data.form.data[fieldName].join(datePickerRefs[index].value.separator)
        };
        index++;
    };
};

const clear = function(){
    for(let fieldName in data.new_fields){
        data.new_fields[fieldName].enable = false;
    };
};

const getData = function(){
    let ret={};

    for(let fieldName in data.new_fields){
        let item = data.new_fields[fieldName];
        if(item.enable) ret[fieldName] = _.clone(data.form.data[fieldName]);
    };

    return ret;
};

const getDataForView = function(){
    let ret = {};

    let index = 0;
    for(let fieldName in data.new_fields){
        let item = data.new_fields[fieldName];
        if(item.enable){
            if(item.type == 'datepicker') ret[item.label] = data.form.data[fieldName].join(datePickerSeparator);
            else if(item.type == 'select') ret[item.label] = item.options[data.form.data[fieldName]];
            else ret[item.label] = _.clone(data.form.data[fieldName]);
        }
        index++;
    };

    return ret;
};

const showModal = function(){
    data.is_modal_hidden = false;
};

const hideModal = function(){
    data.is_modal_hidden = true;
};

const setNewFields = function(){
    let newfields_data = {};

    props.fields.forEach(function (item, index) {
        let currentItem = {};
        if(typeof item == "string"){
            currentItem.name = item;
        }else{
            currentItem = _.cloneDeep(item);
        }

        if(typeof currentItem.label != 'string') currentItem.label = _.startCase(_.toLower(currentItem.name.split('_').join(' ')));

        if(typeof currentItem.type != 'string') currentItem.type = 'text';

        let defaultVal = (currentItem.type == 'datepicker') ? [] : '';
        if(typeof currentItem.default == 'undefined') currentItem.default = defaultVal;
        if(typeof currentItem.defaultEnable == 'undefined') currentItem.defaultEnable = currentItem.enable;

        if(typeof currentItem.enable != 'boolean') currentItem.enable = false;

        newfields_data[currentItem.name] = _.cloneDeep(currentItem);
    });

    data.new_fields = _.cloneDeep(newfields_data);
};

defineExpose({
    clear,
    getData,
    showModal,
    getDataForView,
});
</script>
<template>
    <TransitionRoot as="template" :show="!data.is_modal_hidden">
        <div class="fixed inset-0 z-50 flex justify-center bg-gray-700 bg-opacity-60 overflow-y-auto" @click.self="hideModal">
            <div class="max-w-2xl w-full mt-10">
                <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leave-from="opacity-100 translate-y-0 sm:scale-100" leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
                    <div class="bg-white shadow-sm sm:rounded-lg">
                        <div class="relative px-6 py-3 bg-gray-200 font-semibold sm:rounded-t-lg">
                            <div class="absolute top-0 right-0 mt-3 mr-4 text-gray-500 cursor-pointer" @click="hideModal"><FontAwesomeIcon icon="fa-solid fa-xmark" /></div>
                            <FontAwesomeIcon icon="fa-solid fa-filter" class="mr-2" /> Filter
                        </div>
                        <div class="p-6 bg-white border-b border-gray-200 sm:rounded-b-lg">
                            <ul class="list-none mb-4">
                                <li v-for="(item, field_name, index) in data.new_fields" class="inline-block py-1 px-1.5 bg-gray-100 mr-2 mb-2 rounded" :key="index">
                                    <label class="flex items-center">
                                        <input type="checkbox" v-model="data.new_fields[field_name].enable" class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" :disabled="data.form.processing">
                                        <span class="ml-2 text-sm text-gray-600">{{ item.label }}</span>
                                    </label>
                                </li>
                            </ul>
                            <form @submit.prevent="submit">
                                <template v-for="(item, field_name, index) in data.new_fields" :key="index">
                                    <template v-if="typeof item == 'object'">
                                        <div v-if="typeof item.enable == 'boolean' && item.enable" class="sm:grid sm:grid-cols-5 sm:gap-2" :class="{'mb-2':(index+1)<fields.length}">
                                            <div class="flex items-center">
                                                <label :for="item.name" class="block font-medium text-sm text-gray-700">
                                                    <span>{{ item.label }}</span>
                                                </label>
                                            </div>
                                            <div class="col-span-4 flex items-center">
                                                <template v-if="typeof item.type == 'undefined' || item.type == 'text'">
                                                    <input type="text" :id="item.name" class="mt-1 block w-full max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md" :class="{'bg-gray-200':data.form.processing}" v-model="data.form.data[item.name]" :disabled="data.form.processing" autocomplete="off" required />
                                                </template>
                                                <template v-else-if="item.type == 'select'">
                                                    <select :id="item.name" class="mt-1 block w-full max-w-lg block focus:ring-indigo-500 focus:border-indigo-500 w-full shadow-sm sm:text-sm border-gray-300 rounded-md" :class="{'bg-gray-200':data.form.processing}" v-model="data.form.data[item.name]" :disabled="data.form.processing" autocomplete="off" required>
                                                        <option disabled selected value="">-- SELECT --</option>
                                                        <option v-for="(label, value) in item.options" :value="value">{{ label }}</option>
                                                    </select>
                                                </template>
                                                <template v-else-if="item.type == 'datepicker'">
                                                    <LitepieDatepicker
                                                    :ref="datePickerRefs[index]"
                                                    :id="item.name"
                                                    :formatter="{date: 'DD MMM YYYY',month: 'MMM'}"
                                                    v-model="data.form.data[item.name]"
                                                    :disabled="data.form.processing"
                                                    :separator="datePickerSeparator"
                                                    autocomplete="off"
                                                    required
                                                    />
                                                </template>
                                            </div>
                                        </div>
                                    </template>
                                </template>

                                <div class="flex items-center justify-end mt-4">
                                    <button type="button" class="hover:bg-red-700 bg-red-600 border-transparent text-white px-4 py-2 text-sm mr-2 inline-flex items-center justify-center rounded-md border font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto focus:ring-indigo-500" :class="{'opacity-25':data.form.processing}" :disabled="data.form.processing" @click="resetField">
                                        Reset
                                    </button>
                                    <button type="submit" class="hover:bg-indigo-700 bg-indigo-600 border-transparent text-white px-4 py-2 text-sm mr-2 inline-flex items-center justify-center rounded-md border font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto focus:ring-indigo-500" :class="{'opacity-25':data.form.processing}" :disabled="data.form.processing">
                                        <template v-if="data.form.processing">
                                            <FontAwesomeIcon icon="fa-solid fa-spinner" spin />
                                        </template>
                                        <template v-else>
                                            <FontAwesomeIcon icon="fa-solid fa-search" class="mr-1" /> Search
                                        </template>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </TransitionChild>
            </div>
        </div>
    </TransitionRoot>
</template>
