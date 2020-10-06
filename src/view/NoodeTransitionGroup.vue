<!--------------------------- TEMPLATE ----------------------------->

<template>

    <transition-group 
        name="nd-noode"
        tag="div"
        class="nd-branch-inner"
        :class="branchInnerClass"
        :style="branchInnerStyle"
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

            branchInnerStyle(): {} {
                let orientation = this.noodel.options.orientation;
                let branchDirection = this.noodel.options.branchDirection;
                let style = {};

                if (orientation === 'ltr' || orientation === 'rtl') {
                    if (branchDirection === 'normal') {
                        style['flex-direction'] = 'column';
                    }
                    else if (branchDirection === 'reversed') {
                        style['flex-direction'] = 'column-reverse';
                    }
                }
                else if (orientation === "ttb" || orientation === 'btt') {
                    if (branchDirection === 'normal') {
                        style['flex-direction'] = 'row';
                    }
                    else if (branchDirection === 'reversed') {
                        style['flex-direction'] = 'row-reverse';
                    }
                }

                return style;
            }
        },

    });
    
</script>

<!---------------------------- STYLES ------------------------------>

<style>

    .nd-branch-inner {
        position: relative;
        display: flex;
    }

</style>
