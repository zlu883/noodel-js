<!--------------------------- TEMPLATE ----------------------------->

<template>

    <div
        class="nd-branch-box"
        :class="branchBoxClass"
        :style="branchBoxStyle"
    >
        <div
            v-if="showBranchBackdrop"
            class="nd-branch-backdrop"
            :class="branchBackdropClass"
        />
        <div 
            class="nd-branch" 
            ref="branch"
            :class="branchClass"
            :style="branchStyle"
            @transitionend="onTransitionEnd"
        >  
            <NoodeTransitionGroup
                :noodel="noodel"
                :parent="parent"
            />
        </div>
    </div>
    
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">

    import ResizeSensor from "css-element-queries/src/ResizeSensor.js";

    import NoodeTransitionGroup from './NoodeTransitionGroup.vue';

    import { getFocalHeight } from '../controllers/getters';
    import NoodeState from '../types/NoodeState';
    import NoodelState from '../types/NoodelState';
    import Vue, { PropType } from 'vue';
    import { updateBranchSize } from '../controllers/noodel-align';

    export default Vue.extend({
        
        components: {
            NoodeTransitionGroup
        },

        props: {
            parent: Object as PropType<NoodeState>,
            noodel: Object as PropType<NoodelState>
        },

        mounted() {
            this.parent.branchBoxEl = this.$el as HTMLDivElement;
            this.parent.branchEl = this.$refs.branch as HTMLDivElement;

            updateBranchSize(this.noodel, this.parent);

            let skipResizeDetection = typeof this.parent.options.skipBranchResizeDetection === 'boolean' ? 
                this.parent.options.skipBranchResizeDetection : this.noodel.options.skipResizeDetection;
                
            if (!skipResizeDetection) {
                this.parent.branchResizeSensor = new ResizeSensor(this.parent.branchBoxEl, () => {
                    updateBranchSize(this.noodel, this.parent);
                });
            };   
        },

        beforeDestroy() {
            if (this.parent.branchResizeSensor) this.parent.branchResizeSensor.detach();
        },

        computed: {

            branchBoxStyle(): {} {
                let orientation = this.noodel.options.orientation;
                let transform;

                if (orientation === 'ltr') {
                    transform = `translateX(${this.parent.trunkRelativeOffset}px)`;
                }
                else if (orientation === "rtl") {
                    transform = `translateX(${-(this.parent.trunkRelativeOffset + this.parent.childBranchSize)}px)`;
                }

                return {
                    transform: transform,
                    'pointer-events': !this.parent.isChildrenVisible ? 'none' : null,
                    'opacity': !this.parent.isChildrenVisible && this.parent.isChildrenTransparent ? 0 : null
                };
            },

            branchStyle(): {} {
                return {
                    transform: `translateY(${this.parent.childBranchOffset + getFocalHeight(this.noodel)}px)`
                };
            },

            branchBoxClass(): {} {
                return {
                    'nd-branch-box-focal': this.parent.isFocalParent
                }
            },

            branchBackdropClass(): {} {
                return {
                    'nd-branch-backdrop-focal': this.parent.isFocalParent
                }
            },

            branchClass(): {} {
                return {
                    'nd-branch-move': this.parent.applyBranchMove,
                    'nd-branch-focal': this.parent.isFocalParent
                }
            },

            showBranchBackdrop(): boolean {
                return typeof this.parent.options.showBranchBackdrop === 'boolean'
                    ? this.parent.options.showBranchBackdrop
                    : this.noodel.options.showBranchBackdrops;
            }
        },

        methods: {

            onTransitionEnd(ev: TransitionEvent) {
                if (ev.propertyName === "transform" && ev.target === this.$refs.branch) {
                    if (this.parent.ignoreTransitionEnd) return;
                    this.parent.applyBranchMove = false;
                }
            },
        }
        
    });
    
</script>

<!---------------------------- STYLES ------------------------------>

<style>

    .nd-branch-box {
        position: absolute;
        height: 100%;
        box-sizing: border-box !important;
    }

    .nd-branch-box-enter, .nd-branch-box-leave-active {
        opacity: 0;
    }

    .nd-branch-box-enter-active, .nd-branch-box-leave-active {
        transition-property: opacity;
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000); /* easeOutCubic from Penner equations */
        transition-duration: .5s; 
    }

    .nd-branch-backdrop {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
    }

    .nd-branch {
        position: relative;
        z-index: 1;
    }

    .nd-branch-focal {
        z-index: 10;
    }

    .nd-branch-move {
        transition-property: transform;
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000); /* easeOutCubic from Penner equations */
        transition-duration: .5s; 
    }

</style>