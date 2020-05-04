<!--------------------------- TEMPLATE ----------------------------->

<template>

    <AnimationFade>
        <div 
            class="nd-branch" 
            :class="branchClass"
            :style="branchStyle"
        >  
            <NoodelTrunkBranchNoode
                v-for="child in parent.children"
                :key="child.id"
                :noode="child" 
                :store="store"
            />
        </div>
    </AnimationFade>
    
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">

    import { Component, Prop, Vue, Watch } from "vue-property-decorator";
    import { ResizeSensor } from 'css-element-queries';

    import NoodelTrunkBranchNoode from '@/view/NoodelTrunkBranchNoode.vue';
    import AnimationFade from './AnimationFade.vue';

    import { getFocalHeight } from '@/util/getters';
    import NoodeView from '@/model/NoodeView';
    import NoodelView from '@/model/NoodelView';

	@Component({
        components: {
            NoodelTrunkBranchNoode,
            NoodelTrunkBranch,
            AnimationFade
        }
    })
	export default class NoodelTrunkBranch extends Vue {

        @Prop() parent: NoodeView;
        @Prop() store: NoodelView;

        get branchStyle() {            
            return {
                transform: 'translate(' + this.parent.offset + 'px, ' + (this.parent.branchOffset + getFocalHeight(this.store)) + 'px)'
            }
        }

        get branchClass() {
            return {
                'nd-branch-hidden': !this.parent.isChildrenVisible,
                'nd-branch-focal': this.parent.isFocalParent
            }
        }
    }
    
</script>

<!---------------------------- STYLES ------------------------------>

<style>
    
    .nd-branch {
        position: absolute;
        transition-property: opacity, transform;
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000); /* easeOutCubic from Penner equations */
        transition-duration: 0.5s; 
        opacity: 0.75;
    }

    .nd-branch-hidden {
        opacity: 0;
        pointer-events: none;       
    }

    .nd-branch-focal {
        opacity: 1;
    }
 
</style>