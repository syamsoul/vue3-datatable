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

        return is_disabled ? ["sd-bg-gray-50 sd-text-gray-300 sd-cursor-default"] : ["sd-text-gray-600 sd-bg-white sd-text-gray-500 hover:sd-bg-gray-50"];
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
    <div class="sd-flex sd-flex-col" :class="class">
        <div class="-sd-my-2 -sd-mx-4 sd-overflow-x-auto sm:-sd-mx-6 lg:-sd-mx-8">
            <div class="sd-inline-block sd-min-w-full sd-py-2 sd-align-middle md:sd-px-6 lg:sd-px-8">
                <div class="sd-overflow-hidden sd-shadow sd-ring-1 sd-ring-black sd-ring-opacity-5 md:sd-rounded-lg">
                    <table class="sd-min-w-full sd-divide-y sd-divide-gray-300">
                        <thead class="sd-bg-gray-50">
                            <tr>
                                <th v-for="(item, index) in columns" class="sd-border sd-py-2 sd-px-3" :class="{'sd-cursor-pointer':item.sortable}" @click="sortColumn(item)" :key="index">
                                    <span v-if="data.sortBy == item.db && item.sortable" class="sd-text-sm sd-text-gray-400">
                                        <FontAwesomeIcon v-if="!data.sortDesc" icon="fa-solid fa-arrow-down-short-wide" fixed-width />
                                        <FontAwesomeIcon v-else-if="data.sortDesc" icon="fa-solid fa-arrow-up-short-wide" fixed-width />
                                    </span> {{ item.label }}
                                </th>
                            </tr>
                        </thead>
                        <tbody class="sd-relative sd-divide-y sd-divide-gray-200 sd-bg-white">
                            <template v-if="data.is_loading">
                                <div class="sd-absolute sd-inset-0 sd-text-center sd-py-4 sd-px-2 sd-flex sd-justify-center sd-items-center sd-bg-white sd-bg-opacity-75 sd-z-10"><FontAwesomeIcon icon="fa-solid fa-spinner" spin /></div>
                                <tr v-if="!data.is_init">
                                    <td :colspan="columns.length" class="sd-h-16"></td>
                                </tr>
                            </template>
                            <template v-if="data.is_init">
                                <template v-if="data.data.length <= 0">
                                    <tr>
                                        <td :colspan="columns.length"><div class="sd-text-center sd-text-gray-500 sd-py-4 sd-px-2">No Data</div></td>
                                    </tr>
                                </template>
                                <template v-else>
                                    <tr v-for="(row, index) in data.data">
                                        <td v-for="(item, index2) in columns" class="sd-whitespace-nowrap sd-py-4 sd-pl-4 sd-pr-3 sd-text-sm sd-font-medium sd-text-gray-900 sm:sd-pl-6" :class="item.class">
                                            <template v-if="typeof row[item.db] == 'string' || typeof row[item.db] == 'number' || row[item.db] == null">
                                                <span v-if="!data.is_refreshing" v-html="row[item.db]"></span>
                                            </template>
                                            <template v-else-if="Array.isArray(row[item.db])">
                                                <div class="sd-whitespace-nowrap">
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
    <div class="sd-py-3 sd-text-sm sd-select-none sd-grid sd-grid-cols-2 sd-gap-4">
        <div>
            <span v-if="data.total_filtered_item_count > 0">Showing <b>{{ startEntry }}</b> to <b>{{ endEntry }}</b> of <b>{{ data.total_filtered_item_count }}</b> entries <span v-if="data.total_filtered_item_count != data.total_item_count">(filtered from <b>{{ data.total_item_count }}</b> total entries)</span></span>
        </div>
        <div class="sd-text-right">
            <div class="sd-inline-block">
                <nav class="sd-relative sd-z-0 sd-inline-flex sd-rounded-md sd-shadow-sm -sd-space-x-px" aria-label="Pagination">
                    <button type="button" :class="switchPageBtnClasses('prev')" @click="fetchData(data.page - 1)" class="sd-relative sd-inline-flex sd-items-center sd-px-2 sd-py-2 sd-rounded-l-md sd-border sd-border-gray-300 sd-text-sm sd-font-medium">
                        <span class="sd-sr-only">Previous</span>
                        <!-- Heroicon name: solid/chevron-left -->
                        <svg class="sd-h-5 sd-w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                    </button>
                    <span class="sd-z-10 sd-bg-indigo-50 sd-border-indigo-500 sd-text-indigo-600 sd-relative sd-inline-flex sd-items-center sd-border sd-text-sm sd-font-medium">
                        <select @change="fetchData()" v-model="data.page" class="sd-inline-block sd-py-2 sd-px-3 sd-h-full sd-w-full sd-appearance-none sd-bg-none sd-text-center sd-border-0 focus:sd-border-0 focus:sd-shadow-none focus:sd-ring-0">
                            <template v-for="(item, index) in data.pages">
                                <option :value="item">{{ item }}</option>
                            </template>
                        </select>
                    </span>
                    <button type="button" :class="switchPageBtnClasses('next')" @click="fetchData(data.page + 1)" class="sd-relative sd-inline-flex sd-items-center sd-px-2 sd-py-2 sd-rounded-r-md sd-border sd-border-gray-300 sd-text-sm sd-font-medium">
                        <span class="sd-sr-only">Next</span>
                        <!-- Heroicon name: solid/chevron-right -->
                        <svg class="sd-h-5 sd-w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </nav>
            </div>
        </div>
    </div>
</template>
