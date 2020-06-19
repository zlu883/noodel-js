<!--------------------------- TEMPLATE ----------------------------->

<template>

    <div
        class="nd-branch-box"
        :style="branchBoxStyle"
    >
        <AnimationFade>
            <div 
                class="nd-branch" 
                ref="branch"
                :class="branchClass"
                :style="branchStyle"
            >  
                <transition-group name="noodes">
                    <NoodelTrunkBranchNoode
                        v-for="child in parent.children"
                        :key="child.id"
                        :noode="child" 
                        :store="store"
                    />
                </transition-group>
            </div>
        </AnimationFade>
    </div> 
    
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">

    import { ResizeSensor } from 'css-element-queries';

    import NoodelTrunkBranchNoode from '@/view/NoodelTrunkBranchNoode.vue';
    import AnimationFade from './AnimationFade.vue';

    import { getFocalHeight } from '@/util/getters';
    import NoodeView from '@/types/NoodeView';
    import NoodelView from '@/types/NoodelView';
    import { Axis } from '@/enums/Axis';
    import Vue, { PropType } from 'vue';

    export default Vue.extend({
        
        components: {
            NoodelTrunkBranchNoode,
            AnimationFade
        },

        props: {
            parent: Object as PropType<NoodeView>,
            store: Object as PropType<NoodelView>
        },

        mounted: function() {
            if (this.parent.isFocalParent) {
                this.store.focalBranchEl = this.$refs.branch as Element;
            }

            this.parent.childBranchEl = this.$refs.branch as Element;
        },

        computed: {

            branchStyle(): {} {
                if (this.parent.childBranchOffsetForced !== null) {
                    return {
                        transform: 'translateY(' + (this.parent.childBranchOffsetForced + getFocalHeight(this.store)) + 'px)',
                        "transition-property": "opacity"
                    };
                }
                else {
                    return {
                        transform: 'translateY(' + (this.parent.childBranchOffset + getFocalHeight(this.store)) + 'px)'
                    };
                }
            },

            branchBoxStyle(): {} {
                return {
                    transform: "translateX(" + this.parent.trunkRelativeOffset + 'px)'
                }
            },

            branchClass(): {} {
                return {
                    'nd-branch-hidden': !this.parent.isChildrenVisible,
                    'nd-branch-enter': !this.store.isFirstRenderDone
                }
            }
        },

        watch: {
            "parent.isFocalParent": function (newVal: boolean, oldVal: boolean) {
                if (newVal === true) {
                    this.store.focalBranchEl = this.$refs.branch as Element;
                }
            }
        }
        
    });
    
</script>

<!---------------------------- STYLES ------------------------------>

<style>
    
    .nd-branch-box {
        position: absolute;
        width: 100%;
    }

    .nd-branch {
        position: absolute;
        transition-property: opacity, transform;
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000); /* easeOutCubic from Penner equations */
        transition-duration: .5s; 
        opacity: 1;
    }

    .nd-branch-enter {
        transition-property: opacity;
    }

    .nd-branch-hidden {
        opacity: 0;
        pointer-events: none;       
    }

    .noodes-enter, .noodes-leave-to {
        opacity: 0;
    }

    .noodes-leave-active {
        position: absolute;
        width: 100%;
    }        

</style>