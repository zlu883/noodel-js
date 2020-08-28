<!--------------------------- TEMPLATE ----------------------------->

<template>

    <transition name="nd-branch-box">
        <div
            class="nd-branch-box"
            :class="branchBoxClass"
            :style="branchBoxStyle"
            v-show="parent.isChildrenVisible || parent.isChildrenTransparent"
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
                    :store="store"
                    :parent="parent"
                />
            </div>
        </div>
    </transition>
    
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">

    import { ResizeSensor } from 'css-element-queries';

    import NoodeTransitionGroup from './NoodeTransitionGroup.vue';

    import { getFocalHeight } from '../util/getters';
    import NoodeView from '../types/NoodeView';
    import NoodelView from '../types/NoodelView';
    import { Axis } from '../enums/Axis';
    import Vue, { PropType } from 'vue';
    import { updateBranchSize } from '../controllers/noodel-align';

    export default Vue.extend({
        
        components: {
            NoodeTransitionGroup
        },

        props: {
            parent: Object as PropType<NoodeView>,
            store: Object as PropType<NoodelView>
        },

        mounted() {
            this.parent.branchBoxEl = this.$el as HTMLDivElement;
            this.parent.branchEl = this.$refs.branch as HTMLDivElement;

            updateBranchSize(this.store, this.parent);

            let skipResizeDetection = typeof this.parent.options.skipBranchResizeDetection === 'boolean' ? 
                this.parent.options.skipBranchResizeDetection : this.store.options.skipResizeDetection;
                
            if (!skipResizeDetection) {
                this.parent.branchResizeSensor = new ResizeSensor(this.parent.branchBoxEl, () => {
                    updateBranchSize(this.store, this.parent);
                });
            };   
        },

        beforeDestroy() {
            if (this.parent.branchResizeSensor) this.parent.branchResizeSensor.detach();
        },

        computed: {

            branchBoxStyle(): {} {
                return {
                    left: `${this.parent.trunkRelativeOffset}px`,
                    'pointer-events': !this.parent.isChildrenVisible ? 'none' : null,
                    'opacity': !this.parent.isChildrenVisible && this.parent.isChildrenTransparent ? 0 : null
                };
            },

            branchStyle(): {} {
                return {
                    transform: `translateY(${this.parent.childBranchOffset + getFocalHeight(this.store)}px)`
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
                    : this.store.options.showBranchBackdrops;
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
        width: 150%;
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