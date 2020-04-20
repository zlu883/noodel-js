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

    .nd-canvas h1 {
        font-size: 1.5rem;
        line-height: 2rem;
        margin: 0 0 0.5rem 0;
    }

    .nd-canvas h2 {
        font-size: 1.2rem;
        line-height: 1.6rem;
        margin: 0 0 0.4rem 0;
    }

    .nd-canvas p {
        font-size: 1rem;
        line-height: 1.3rem;
        margin: 0 0 0.3rem 0;
    }

    .nd-canvas li {
        margin: 0 0 0.3rem 0;
    }

    .nd-canvas ul {
        padding-left: 2rem;
        margin: 0 0 0.3rem 0;
    }

    .nd-canvas p:empty {
        height: 1.3rem;
    }

    .nd-canvas h2:empty {
        height: 1.6rem;
    }

    .nd-canvas h1:empty {
        height: 2rem;
    }

    .nd-canvas code {
        background-color: #999999;
        color: white;
        border-radius: .5rem;
        padding: .2rem .5rem;
        font-weight: bold;
    }

    .nd-canvas input {
        font-size: 1rem;
        padding: 0.2rem 0.6rem;
        border-radius: 0.3rem;
    }

    .nd-canvas pre {
        background: black;
        color: white;
        border-radius: .5rem;
        padding: .5rem;
        white-space: pre-wrap;
        box-sizing: border-box;
        margin-right: .3rem;
    }

    .nd-canvas pre code {
        background-color: transparent;
        font-weight: inherit;
    }

    .nd-canvas img {
        max-width: 100%;
        vertical-align: middle;
    }

    /** Third party library style overrides */

    .ps__rail-x, .ps__rail-y {
        opacity: 0.4;
    }

    .ps:hover > .ps__rail-x,
    .ps:hover > .ps__rail-y,
    .ps--focus > .ps__rail-x,
    .ps--focus > .ps__rail-y,
    .ps--scrolling-x > .ps__rail-x,
    .ps--scrolling-y > .ps__rail-y {
        opacity: 0.8;
    }
    
</style>
