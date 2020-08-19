<!--------------------------- TEMPLATE ----------------------------->

<template>

    <transition-group 
        name="nd-noode"
        tag="div"
    >
        <NoodelCanvasTrunkBranchNoode
            v-for="child in parent.children"
            :key="child.id"
            :noode="child" 
            :store="store"
        />
    </transition-group>
    
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">

    import NoodelCanvasTrunkBranchNoode from "./NoodelCanvasTrunkBranchNoode.vue";

    import NoodelView from '../types/NoodelView';
    import NoodeView from '../types/NoodeView';
    import Vue, { PropType } from 'vue';

    // By extracting the transition-group into its own component addresses the issue
    // of enter/leave transitions not occuring properly as per https://github.com/vuejs/vue/issues/6946
    export default Vue.extend({
        
        components: {
            NoodelCanvasTrunkBranchNoode
        },

        props: {
            parent: Object as PropType<NoodeView>,
            store: Object as PropType<NoodelView>
        },

    });
    
</script>

<!---------------------------- STYLES ------------------------------>

<style>

</style>
