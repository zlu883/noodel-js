<!--------------------------- TEMPLATE ----------------------------->

<template>

    <div 
        class="nd-canvas"
        ref="canvas"
        tabindex="0"
        @dragstart.prevent
    >
        <NoodelLimits 
            :store="store"
        />
        <div
            class="nd-trunk"
            :class="trunkClass"
            ref="trunk"
            :style="trunkStyle"
        >
            <NoodelTrunkBranch
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

    import NoodelLimits from '@/view/NoodelLimits.vue';
    import NoodelTrunkBranch from "@/view/NoodelTrunkBranch.vue";

    import { getFocalWidth } from '@/util/getters';
    import { setupContainer } from '@/controllers/noodel-setup';
    import { setupNoodelInputBindings } from '@/controllers/input-binding';
    import { traverseDescendents } from '../controllers/noodel-traverse';
    import NoodelView from '@/types/NoodelView';
    import { alignBranchToIndex, alignTrunkToBranch } from '../controllers/noodel-align';
    import NoodeView from '@/types/NoodeView';
    import Vue, { PropType } from 'vue';

    export default Vue.extend({
        
        components: {
            NoodelLimits,
            NoodelTrunkBranch
        },

        props: {
            store: Object as PropType<NoodelView>
        },

        mounted: function() {
            setupContainer(this.$el, this.store);
            setupNoodelInputBindings(this.$el, this.store);
            this.store.trunkEl = this.$refs.trunk as Element;
            this.store.canvasEl = this.$refs.canvas as Element;
            
            this.$nextTick(() => {
                this.allBranchParents.forEach(parent => {
                    alignBranchToIndex(parent, parent.activeChildIndex);
                });

                alignTrunkToBranch(this.store, this.store.focalParent);
                
                requestAnimationFrame(() => {
                    this.store.isFirstRenderDone = true;

                    this.$nextTick(() => {
                        if (typeof this.store.options.onMount === 'function') {
                            this.store.options.onMount();
                        }; 
                    });           
                });
            });   
        },

        destroyed: function() {
            console.log("destroyed")
            this.store.isFirstRenderDone = false;
            this.store.trunkOffset = 0;
            this.store.trunkOffsetAligned = 0;
            delete this.store.canvasEl;
            delete this.store.trunkEl;
            delete this.store.focalBranchEl;
            traverseDescendents(this.store.root, (noode) => {
                noode.trunkRelativeOffset = 0;
                noode.branchRelativeOffset = 0;
                noode.isChildrenTransparent = true;
                noode.size = 0;
                noode.branchSize = 0;
                noode.childBranchOffset = 0;
                noode.childBranchOffsetAligned = 0;
                delete noode.childBranchEl;
                delete noode.el;
                delete noode.resizeSensor;
            }, true);
        },

        computed: {

            trunkStyle(): {} {
                if (this.store.trunkOffsetForced !== null) {
                    return {
                        transform: 'translateX(' + (this.store.trunkOffsetForced + getFocalWidth(this.store)) + 'px)',
                        "transition-property": "none"
                    };
                }
                else {
                    return {
                        transform: 'translateX(' + (this.store.trunkOffset + getFocalWidth(this.store)) + 'px)'
                    };
                }
            },

            trunkClass(): {} {
                return {
                    'nd-trunk-enter': !this.store.isFirstRenderDone
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
        }

    });
    
</script>

<!---------------------------- STYLES ------------------------------>

<style>

	.nd-canvas {
        font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
        width: 100%;
        height: 100%;
        cursor: grab;
        overflow: hidden;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        background-color: #a6a6a6;
	}

    .nd-trunk {
        position: relative;
        width: 100%;
        opacity: 1;
        transition-property: transform;
        transition-duration: .5s; 
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000); /* easeOutCubic from Penner equations */
    }

    .nd-trunk-enter {
        transition-property: none;
    }
    
</style>
