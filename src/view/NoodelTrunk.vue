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

    import { Component, Vue, Prop } from "vue-property-decorator";

    import NoodelLimits from '@/view/NoodelLimits.vue';
    import NoodelTrunkBranch from "@/view/NoodelTrunkBranch.vue";

    import { getFocalWidth } from '@/util/getters';
    import Noodel from '@/main/Noodel';
    import { setupContainer } from '@/controllers/noodel-setup';
    import { setupNoodelInputBindings } from '@/controllers/input-binding';
    import { traverseDescendents, findNoodeByPath } from '../controllers/noodel-traverse';
    import NoodelView from '@/model/NoodelView';
    import { Axis } from '@/enums/Axis';
    import { jumpToNoode } from '../controllers/noodel-navigate';
    import { alignBranchToIndex, alignTrunkToBranch } from '../controllers/noodel-align';
    import NoodeView from '@/model/NoodeView';

    @Component({
		components: {
            NoodelLimits,
            NoodelTrunkBranch,
		}
	})
    export default class NoodelTrunk extends Vue {
        
        @Prop() store: NoodelView;

        mounted() {
            setupContainer(this.$el, this.store);
            setupNoodelInputBindings(this.$el, this.store);
            this.store.trunkEl = this.$refs.trunk as Element;
            this.store.canvasEl = this.$refs.canvas as Element;
            
            this.allBranchParents.forEach(parent => {
                alignBranchToIndex(parent, parent.activeChildIndex);
            });

            alignTrunkToBranch(this.store, this.store.focalParent);
            
            requestAnimationFrame(() => {
                this.store.isFirstRenderDone = true;

                if (typeof this.store.options.mounted === 'function') {
                    this.store.options.mounted();
                };           
            });
        }

        get trunkStyle() {
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
        }

        get trunkClass() {
            return {
                'nd-trunk-enter': !this.store.isFirstRenderDone
            };
        }

        get allBranchParents() {
            let allBranchParents: NoodeView[] = [];

            traverseDescendents(this.store.root, desc => {
                if (desc.children.length > 0) {
                    allBranchParents.push(desc);
                }
            }, true);

            return allBranchParents;
        }
    }
    
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
        opacity: 1;
        width: 99999999px !important; /* Need arbitrary large width otherwise noodes may collapse */
        transition-property: transform;
        transition-duration: .5s; 
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000); /* easeOutCubic from Penner equations */
    }

    .nd-trunk-enter {
        transition-property: none;
    }
    
</style>
