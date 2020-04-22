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
            <NoodelTrunkBranch
                v-if="store.root && store.root.isChildrenVisible"
                :style="trunkStyle"
                :parent="store.root"
                :level="0"
                :path="'0'"
                :offset="0"
                :store="store"
            />
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
                // Using left instead of translateX actually results in smoother movement
                // as well as prevents glitch in Chrome
                left: (this.store.trunkOffset + getFocalWidth(this.store)) + 'px',
            };
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
        position: relative;
        overflow: hidden;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        background-color: #49b9e9;
	}
    
</style>
