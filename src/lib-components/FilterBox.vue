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

    emit('formReady', {
        getData,
        getDataForView,
        form: data.form,
        hideModal,
    });
});

const submit = function(){
    data.form.processing = true;
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
});
</script>
<template>
    <TransitionRoot as="template" :show="!data.is_modal_hidden">
        <div class="sd-fixed sd-inset-0 sd-z-50 sd-flex sd-justify-center sd-bg-gray-700 sd-bg-opacity-60 sd-overflow-y-auto" @click.self="hideModal">
            <div class="sd-max-w-2xl sd-w-full sd-mt-10">
                <TransitionChild as="template" enter="sd-ease-out sd-duration-300" enter-from="sd-opacity-0 sd-translate-y-4 sm:sd-translate-y-0 sm:sd-scale-95" enter-to="sd-opacity-100 sd-translate-y-0 sm:sd-scale-100" leave="sd-ease-in sd-duration-200" leave-from="sd-opacity-100 sd-translate-y-0 sm:sd-scale-100" leave-to="sd-opacity-0 sd-translate-y-4 sm:sd-translate-y-0 sm:sd-scale-95">
                    <div class="sd-bg-white sd-shadow-sm sm:sd-rounded-lg">
                        <div class="sd-relative sd-px-6 sd-py-3 sd-bg-gray-200 sd-font-semibold sm:sd-rounded-t-lg">
                            <div class="sd-absolute sd-top-0 sd-right-0 sd-mt-3 sd-mr-4 sd-text-gray-500 sd-cursor-pointer" @click="hideModal"><FontAwesomeIcon icon="fa-solid fa-xmark" /></div>
                            <FontAwesomeIcon icon="fa-solid fa-filter" class="sd-mr-2" /> Filter
                        </div>
                        <div class="sd-p-6 sd-bg-white sd-border-b sd-border-gray-200 sm:sd-rounded-b-lg">
                            <ul class="sd-list-none sd-mb-4">
                                <li v-for="(item, field_name, index) in data.new_fields" class="sd-inline-block sd-py-1 sd-px-1.5 sd-bg-gray-100 sd-mr-2 sd-mb-2 sd-rounded" :key="index">
                                    <label class="sd-flex sd-items-center">
                                        <input type="checkbox" v-model="data.new_fields[field_name].enable" class="sd-rounded sd-border-gray-300 sd-text-indigo-600 sd-shadow-sm focus:sd-border-indigo-300 focus:sd-ring focus:sd-ring-indigo-200 focus:sd-ring-opacity-50" :disabled="data.form.processing">
                                        <span class="sd-ml-2 sd-text-sm sd-text-gray-600">{{ item.label }}</span>
                                    </label>
                                </li>
                            </ul>
                            <form @submit.prevent="submit">
                                <template v-for="(item, field_name, index) in data.new_fields" :key="index">
                                    <template v-if="typeof item == 'object'">
                                        <div v-if="typeof item.enable == 'boolean' && item.enable" class="sm:sd-grid sm:sd-grid-cols-5 sm:sd-gap-2" :class="{'sd-mb-2':(index+1)<fields.length}">
                                            <div class="sd-flex sd-items-center">
                                                <label :for="item.name" class="sd-block sd-font-medium sd-text-sm sd-text-gray-700">
                                                    <span>{{ item.label }}</span>
                                                </label>
                                            </div>
                                            <div class="sd-col-span-4 sd-flex sd-items-center">
                                                <template v-if="typeof item.type == 'undefined' || item.type == 'text'">
                                                    <input type="text" :id="item.name" class="sd-mt-1 sd-block sd-w-full sd-max-w-lg sd-block sd-w-full sd-shadow-sm focus:sd-ring-indigo-500 focus:sd-border-indigo-500 sm:sd-text-sm sd-border-gray-300 sd-rounded-md" :class="{'sd-bg-gray-200':data.form.processing}" v-model="data.form.data[item.name]" :disabled="data.form.processing" autocomplete="off" required />
                                                </template>
                                                <template v-else-if="item.type == 'select'">
                                                    <select :id="item.name" class="sd-mt-1 sd-block sd-w-full sd-max-w-lg sd-block focus:sd-ring-indigo-500 focus:sd-border-indigo-500 sd-w-full sd-shadow-sm sm:sd-text-sm sd-border-gray-300 sd-rounded-md" :class="{'sd-bg-gray-200':disabled}" v-model="data.form.data[item.name]" :disabled="data.form.processing" autocomplete="off" required>
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

                                <div class="sd-text-right sd-mt-4">
                                    <button type="button" class="hover:sd-bg-red-700 sd-bg-red-600 sd-border-transparent sd-text-white sd-px-4 sd-py-2 sd-text-sm sd-mr-2 sd-inline-flex sd-items-center sd-justify-center sd-rounded-md sd-border sd-font-medium sd-shadow-sm focus:sd-outline-none focus:sd-ring-2 focus:sd-ring-offset-2 sm:sd-w-auto focus:sd-ring-indigo-500" :class="{'sd-opacity-25':data.form.processing}" :disabled="data.form.processing" @click="resetField">
                                        Reset
                                    </button>
                                    <button type="button" class="hover:sd-bg-indigo-700 sd-bg-indigo-600 sd-border-transparent sd-text-white sd-px-4 sd-py-2 sd-text-sm sd-mr-2 sd-inline-flex sd-items-center sd-justify-center sd-rounded-md sd-border sd-font-medium sd-shadow-sm focus:sd-outline-none focus:sd-ring-2 focus:sd-ring-offset-2 sm:sd-w-auto focus:sd-ring-indigo-500" :class="{'sd-opacity-25':data.form.processing}" :disabled="data.form.processing" @click="resetField">
                                        <template v-if="data.form.processing">
                                            <FontAwesomeIcon icon="fa-solid fa-spinner" spin />
                                        </template>
                                        <template v-else>
                                            <FontAwesomeIcon icon="fa-solid fa-search" class="sd-mr-1" spin /> Search
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
