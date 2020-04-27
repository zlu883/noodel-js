<!--------------------------- TEMPLATE ----------------------------->

<template>

    <div 
        class="nd-canvas"
        tabindex="0"
        @dragstart.prevent
    >
        <NoodelLimits 
            :store="store"
        />
        <AnimationFade>
            <div
                class="nd-trunk"
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

    import { getFocalWidth } from '@/getters/getters';
    import Noodel from '@/main/Noodel';
    import { setupContainer } from '@/controllers/noodel-setup';
    import { setupNoodelInputBindings } from '@/controllers/input-binding';
    import { traverseDescendents } from '../controllers/noodel-traverse';

    @Component({
		components: {
            NoodelLimits,
            NoodelTrunkBranch,
            AnimationFade,
		}
	})
    export default class NoodelTrunk extends Vue {
        
        @Prop() noodel: Noodel;

        store = (this.noodel as any).store;

        mounted() {
            setupContainer(this.$el, this.store);
            setupNoodelInputBindings(this.$el, this.store);
            this.$nextTick(this.store.options.mounted);
        }

        get trunkStyle() {
            return {
                transform: 'translateX(' + (this.store.trunkOffset + getFocalWidth(this.store)) + 'px)'
            };
        }

        get allBranchParents() {
            let allBranchParents = [];

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
        background-color: #49b9e9;
	}

    .nd-trunk {
        width: 9999999px;
        position: relative;
    }
    
</style>
