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
        <AnimationFade>
            <div
                class="nd-trunk"
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
        </AnimationFade>
    </div>
    
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">

    import { Component, Vue, Prop } from "vue-property-decorator";

    import NoodelLimits from '@/view/NoodelLimits.vue';
    import NoodelTrunkBranch from "@/view/NoodelTrunkBranch.vue";
    import AnimationFade from '@/view/AnimationFade.vue';

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
            AnimationFade,
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
            
            if (this.store.options.initialPath) {
                let target = findNoodeByPath(this.store, this.store.options.initialPath);
                if (target) jumpToNoode(this.store, target);
            }
            
            requestAnimationFrame(() => {
                if (typeof this.store.options.mounted === 'function') {
                    this.store.options.mounted();
                };           
            });
        }

        get trunkStyle() {
            let style = {
                transform: 'translateX(' + (this.store.trunkOffset + getFocalWidth(this.store)) + 'px)'
            };

            if (this.store.hasSwipe && this.store.panAxis === Axis.HORIZONTAL) {
                style["transition-property"] = "none"; // disable transform transition if user is panning
            }

            return style;
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
        transition-property: transform;
        transition-duration: .5s; 
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000); /* easeOutCubic from Penner equations */
    }
    
</style>
