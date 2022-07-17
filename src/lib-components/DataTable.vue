<script setup>
import { computed, onBeforeMount, reactive, nextTick } from 'vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faArrowDownShortWide } from '@fortawesome/free-solid-svg-icons';
import { faArrowUpShortWide } from '@fortawesome/free-solid-svg-icons';
library.add(faSpinner,faArrowDownShortWide,faArrowUpShortWide);

const props = defineProps({
    columns: Array,
    fetchUrl: String,
    defaultSortBy: String,
    defaultSortDesc: Boolean,
    isSearchEnable: {type:Boolean, default:false},
    class: {type:[String,Object,Array], default:''},
});

const data = reactive({
    is_loading: true,
    page: 1,
    items_per_page: 10,
    data: [],
    sortBy: null,
    sortDesc: null,
    is_init: false,
    draw_count: 0,
    is_refreshing: false,
    extra_params: {},
    total_item_count: 0,
    total_filtered_item_count: 0,
    search_string: '',
    pages:[],
});

onBeforeMount(()=>{
    if(typeof props.defaultSortBy != "undefined") data.sortBy = props.defaultSortBy;
    if(typeof props.defaultSortDesc != "undefined") data.sortDesc = props.defaultSortDesc;
});

const switchPageBtnClasses = computed(()=>{
    let self = this;
    return function(type){
        let is_disabled = false;
        if(data.is_loading){
            is_disabled = true;
        }else{
            if(type=="prev"){
                if(data.page <= 1) is_disabled = true;
            }else if(type=="next"){
                if(data.page >= maxPage.value) is_disabled = true;
            }
        }

        return is_disabled ? ["bg-gray-50 text-gray-300 cursor-default"] : ["text-gray-600 bg-white text-gray-500 hover:bg-gray-50"];
    };
});

const startEntry = computed(()=>{
    return new Intl.NumberFormat().format( ((data.page-1)*data.items_per_page) + 1 );
});

const endEntry = computed(()=>{
    let endEntry = ((data.page-1)*data.items_per_page) + data.items_per_page;
    return new Intl.NumberFormat().format( endEntry < data.total_filtered_item_count ? endEntry : data.total_filtered_item_count );
});

const maxPage = computed(()=>{
    return Math.ceil(data.total_filtered_item_count / data.items_per_page);
});

const fetchData = function(page=null, extra_params=null, execAfterDone=function(){})
{
    let self = this;

    if(data.is_init && data.is_loading) return false;

    if(page == null) page = data.page;
    if(page < 1) return false;

    if(page > data.page){
        if(page > maxPage.value) return false;
    }

    let params = {...getParams(extra_params), ...{
        page: page,
    }};

    data.draw_count++;
    data.is_loading = true;
    axios.get(props.fetchUrl, {
        params,
    })
    .then(async function (res) {
        let resData = res.data;
        data.page = page;
        data.data = resData.data.items;
        data.total_item_count = resData.data.total_item_count;
        data.total_filtered_item_count = resData.data.total_filtered_item_count;
        data.pages=[]; for(let i=1; i<=maxPage.value; i++) data.pages.push(i);

        data.is_loading = false;
        if(!data.is_init) data.is_init = true;

        data.is_refreshing = true;
        await nextTick();

        data.is_refreshing = false;
        if(typeof execAfterDone == "function") execAfterDone(res);
    });
};

const sortColumn = function(column)
{
    if(!column.sortable) return false;

    if(column.db == data.sortBy) data.sortDesc = !data.sortDesc;
    else{
        data.sortBy = column.db;
        data.sortDesc = false;
    }
    fetchData();
};

const search = function()
{
    if(props.isSearchEnable) fetchData();
};

const getParams = function(extra_params=null, is_url_params_mode=false)
{
    let params = {
        itemsPerPage: data.items_per_page,
    };

    if(data.search_string != '') params['search'] = data.search_string;
    if(data.sortBy != null) params['sortBy'] = data.sortBy;
    if(data.sortDesc != null) params['sortDesc'] = data.sortDesc;

    if(_.isObject(extra_params)){
        data.extra_params = extra_params;
    }
    params = {...data.extra_params, ...params};

    if(is_url_params_mode){
        let url_params = {};
        for(let key in params){
            let v = params[key];
            if(Array.isArray(v)){
                for(let i in v){
                    url_params[`${key}[${i}]`] = v[i];
                }
            }else{
                url_params[key] = v;
            }
        };

        return (new URLSearchParams(url_params)).toString();
    }

    return params;
};

defineExpose({
    fetchData,
    getParams,
})
</script>

<template>
    <div class="flex flex-col" :class="class">
        <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table class="min-w-full divide-y divide-gray-300">
                        <thead class="bg-gray-50">
                            <tr>
                                <th v-for="(item, index) in columns" class="border py-2 px-3" :class="{'cursor-pointer':item.sortable}" @click="sortColumn(item)" :key="index">
                                    <span v-if="data.sortBy == item.db && item.sortable" class="text-sm text-gray-400">
                                        <FontAwesomeIcon v-if="!data.sortDesc" icon="fa-solid fa-arrow-down-short-wide" fixed-width />
                                        <FontAwesomeIcon v-else-if="data.sortDesc" icon="fa-solid fa-arrow-up-short-wide" fixed-width />
                                    </span> {{ item.label }}
                                </th>
                            </tr>
                        </thead>
                        <tbody class="relative divide-y divide-gray-200 bg-white">
                            <template v-if="data.is_loading">
                                <div class="absolute inset-0 text-center py-4 px-2 flex justify-center items-center bg-white bg-opacity-75 z-10"><FontAwesomeIcon icon="fa-solid fa-spinner" spin /></div>
                                <tr v-if="!data.is_init">
                                    <td :colspan="columns.length" class="h-16"></td>
                                </tr>
                            </template>
                            <template v-if="data.is_init">
                                <template v-if="data.data.length <= 0">
                                    <tr>
                                        <td :colspan="columns.length"><div class="text-center text-gray-500 py-4 px-2">No Data</div></td>
                                    </tr>
                                </template>
                                <template v-else>
                                    <tr v-for="(row, index) in data.data">
                                        <td v-for="(item, index2) in columns" class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6" :class="item.class">
                                            <template v-if="typeof row[item.db] == 'string' || typeof row[item.db] == 'number' || row[item.db] == null">
                                                <span v-if="!data.is_refreshing" v-html="row[item.db]"></span>
                                            </template>
                                            <template v-else-if="Array.isArray(row[item.db])">
                                                <div class="whitespace-nowrap">
                                                    <template v-for="(slot, index3) in row[item.db]">
                                                        <slot v-if="!data.is_refreshing" :name="slot.slotName" :data="slot"></slot>
                                                    </template>
                                                </div>
                                            </template>
                                            <template v-else>
                                                <slot v-if="!data.is_refreshing" :name="row[item.db].slotName" :data="row[item.db]"></slot>
                                            </template>
                                        </td>
                                    </tr>
                                </template>
                            </template>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    <div class="py-3 text-sm select-none grid grid-cols-2 gap-4">
        <div>
            <span v-if="data.total_filtered_item_count > 0">Showing <b>{{ startEntry }}</b> to <b>{{ endEntry }}</b> of <b>{{ data.total_filtered_item_count }}</b> entries <span v-if="data.total_filtered_item_count != data.total_item_count">(filtered from <b>{{ data.total_item_count }}</b> total entries)</span></span>
        </div>
        <div class="text-right">
            <div class="inline-block">
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button type="button" :class="switchPageBtnClasses('prev')" @click="fetchData(data.page - 1)" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium">
                        <span class="sr-only">Previous</span>
                        <!-- Heroicon name: solid/chevron-left -->
                        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                    </button>
                    <span class="z-10 bg-indigo-50 border-indigo-500 text-indigo-600 relative inline-flex items-center border text-sm font-medium">
                        <select @change="fetchData()" v-model="data.page" class="inline-block py-2 px-3 h-full w-full appearance-none bg-none text-center border-0 focus:border-0 focus:shadow-none focus:ring-0">
                            <template v-for="(item, index) in data.pages">
                                <option :value="item">{{ item }}</option>
                            </template>
                        </select>
                    </span>
                    <button type="button" :class="switchPageBtnClasses('next')" @click="fetchData(data.page + 1)" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium">
                        <span class="sr-only">Next</span>
                        <!-- Heroicon name: solid/chevron-right -->
                        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </nav>
            </div>
        </div>
    </div>
</template>
