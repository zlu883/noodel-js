<!--------------------------- TEMPLATE ----------------------------->

<template>

    <div 
        class="nd-canvas"
        ref="canvas"
        tabindex="0"
        @dragstart="onDragStart"
    >
        <transition name="nd-limit">
            <div 
                class="nd-limit nd-limit-left"
                v-if="store.options.showLimitIndicators" 
                v-show="store.showLimits.left"
            />
        </transition>
        <transition name="nd-limit">
            <div 
                class="nd-limit nd-limit-right"
                v-if="store.options.showLimitIndicators" 
                v-show="store.showLimits.right"
            />
        </transition>
        <transition name="nd-limit">
            <div 
                class="nd-limit nd-limit-top" 
                v-if="store.options.showLimitIndicators" 
                v-show="store.showLimits.top"
            />
        </transition>
        <transition name="nd-limit">
            <div 
                class="nd-limit nd-limit-bottom"
                v-if="store.options.showLimitIndicators" 
                v-show="store.showLimits.bottom"
            />
        </transition>
        <div
            ref="trunk"
            class="nd-trunk"
            :class="trunkClass"
            :style="trunkStyle"
            @transitionend="onTransitionEnd"
        >
            <NoodelCanvasTrunkBranch
                v-for="parent in allBranchParents"
                :key="parent.id"                  
                :parent="parent"
                :store="store"
            />
        </div>
    </div>
    
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">

    import NoodelCanvasTrunkBranch from "./NoodelCanvasTrunkBranch.vue";

    import { getFocalWidth } from '../util/getters';
    import { setupContainer } from '../controllers/noodel-setup';
    import { setupCanvasInput } from '../controllers/input-binding';
    import { traverseDescendents } from '../controllers/noodel-traverse';
    import NoodelView from '../types/NoodelView';
    import { alignBranchToIndex, alignTrunkToBranch } from '../controllers/noodel-align';
    import NoodeView from '../types/NoodeView';
    import Vue, { PropType } from 'vue';

    export default Vue.extend({
        
        components: {
            NoodelCanvasTrunkBranch
        },

        props: {
            store: Object as PropType<NoodelView>
        },

        mounted: function() {
            setupContainer(this.$el, this.store);
            setupCanvasInput(this.$el as HTMLDivElement, this.store);
            this.store.trunkEl = this.$refs.trunk as Element;
            this.store.canvasEl = this.$refs.canvas as Element;
            
            this.$nextTick(() => {
                this.allBranchParents.forEach(parent => {
                    alignBranchToIndex(parent, parent.activeChildIndex);
                });

                alignTrunkToBranch(this.store, this.store.focalParent);
                
                requestAnimationFrame(() => {
                    this.$nextTick(() => {
                        this.store.isFirstRenderDone = true;

                        if (typeof this.store.options.onMount === 'function') {
                            this.store.options.onMount();
                        }; 
                    });           
                });
            });   
        },

        destroyed: function() {
            this.store.trunkOffset = 0;
            this.store.trunkOffsetAligned = 0;
            delete this.store.canvasEl;
            delete this.store.trunkEl;
            delete this.store.isFirstRenderDone;
            traverseDescendents(this.store.root, (noode) => {
                noode.trunkRelativeOffset = 0;
                noode.branchRelativeOffset = 0;
                noode.isChildrenTransparent = true;
                noode.size = 0;
                noode.branchSize = 0;
                noode.childBranchOffset = 0;
                noode.childBranchOffsetAligned = 0;
                delete noode.branchSliderEl;
                delete noode.branchBoxEl;
                delete noode.el;
                delete noode.resizeSensor;
                delete noode.branchResizeSensor;
            }, true);
        },

        computed: {

            trunkStyle(): {} {
                return {
                    transform: 'translateX(' + (this.store.trunkOffset + getFocalWidth(this.store)) + 'px)'
                };
            },

            trunkClass(): {} {
                return {
                    'nd-trunk-move': this.store.applyTrunkMove
                };
            },

            allBranchParents(): NoodeView[] {
                let allBranchParents: NoodeView[] = [];

                traverseDescendents(this.store.root, desc => {
                    if (desc.children.length > 0) {
                        allBranchParents.push(desc);
                    }
                }, true);

                return allBranchParents;
            }
        },

        methods: {

            onTransitionEnd(ev: TransitionEvent) {
                if (ev.propertyName === "transform" && ev.target === this.$refs.trunk) {
                    if (this.store.ignoreTransitionEnd) return;
                    this.store.applyTrunkMove = false;
                }
            },

            onDragStart(ev: DragEvent) {
                if (this.store.isInInspectMode) return;
                ev.preventDefault();
            }
        }

    });
    
</script>

<!---------------------------- STYLES ------------------------------>

<style>

	.nd-canvas {
        position: relative;
        width: 800px;
        height: 600px;
        overflow: hidden;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        cursor: grab;
        background-color: #a6a6a6;
        overscroll-behavior: none;
    }

    .nd-limit {
        position: absolute;
        z-index: 9999;
        border: solid 0px;
        background-color: #595959;
    }

    .nd-limit-enter, .nd-limit-leave-active {
        opacity: 0;
    }

    .nd-limit-enter-active, .nd-limit-leave-active {
        transition-property: opacity;
        transition-duration: 0.5s;
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
    }

    .nd-limit-left {   
        top: 0;
        left: 0;
        height: 100%;
        width: 1em;
    }

    .nd-limit-right {
        top: 0;
        right: 0;
        height: 100%;
        width: 1em;
    }

    .nd-limit-top {
        top: 0;
        left: 0;
        height: 1em;
        width: 100%;
    }

    .nd-limit-bottom {
        bottom: 0;
        left: 0;
        height: 1em;
        width: 100%;
    }

    .nd-trunk {
        position: relative;
        height: 100%;
        width: 999999999px !important;
    }

    .nd-trunk-move {
        transition-property: transform;
        transition-duration: .5s; 
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000); /* easeOutCubic from Penner equations */
    }

</style>
