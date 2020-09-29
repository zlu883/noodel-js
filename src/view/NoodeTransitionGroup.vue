<!--------------------------- TEMPLATE ----------------------------->

<template>

    <transition-group 
        name="nd-noode"
        tag="div"
        class="nd-branch-inner"
        :class="branchInnerClass"
    >
        <NoodelCanvasTrunkBranchNoode
            v-for="child in parent.children"
            :key="child.id"
            :noode="child" 
            :noodel="noodel"
        />
    </transition-group>
    
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">

    import NoodelCanvasTrunkBranchNoode from "./NoodelCanvasTrunkBranchNoode.vue";

    import NoodelState from '../types/NoodelState';
    import NoodeState from '../types/NoodeState';
    import Vue, { PropType } from 'vue';

    // By extracting the transition-group into its own component addresses the issue
    // of enter/leave transitions not occuring properly as per https://github.com/vuejs/vue/issues/6946
    export default Vue.extend({
        
        components: {
            NoodelCanvasTrunkBranchNoode
        },

        props: {
            parent: Object as PropType<NoodeState>,
            noodel: Object as PropType<NoodelState>
        },

        computed: {

            branchInnerClass(): {} {
                return {
                    'nd-branch-inner-focal': this.parent.isFocalParent
                }
            },
        },

    });
    
</script>

<!---------------------------- STYLES ------------------------------>

<style>

    .nd-branch-inner {
        position: relative;
    }

</style>
