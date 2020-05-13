<!--------------------------- TEMPLATE ----------------------------->

<template>

    <div 
        class="nd-branch" 
        ref="branch"
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
    import { Axis } from '@/enums/Axis';

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

        mounted() {
            if (this.parent.isFocalParent) {
                this.store.focalBranchEl = this.$refs.branch as Element;
            }

            this.parent.childBranchEl = this.$refs.branch as Element;
        }

        get branchStyle() {
            if (this.parent.childBranchOffsetForced !== null) {
                return {
                    left: this.parent.trunkRelativeOffset + 'px',
                    transform: 'translateY(' + (this.parent.childBranchOffsetForced + getFocalHeight(this.store)) + 'px)',
                    "transition-property": "opacity"
                };
            }
            else {
                return {
                    left: this.parent.trunkRelativeOffset + 'px',
                    transform: 'translateY(' + (this.parent.childBranchOffset + getFocalHeight(this.store)) + 'px)'
                };
            }
        }

        get branchClass() {
            return {
                'nd-branch-hidden': !this.parent.isChildrenVisible,
                'nd-branch-focal': this.parent.isFocalParent,
                'nd-branch-enter': !this.store.isFirstRenderDone
            }
        }

        @Watch("parent.isFocalParent")
        onIsFocalParentChanged(newVal: boolean, oldVal: boolean) {
            if (newVal === true) {
                this.store.focalBranchEl = this.$refs.branch as Element;
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

    .nd-branch-enter {
        transition-property: opacity;
    }

    .nd-branch-hidden {
        opacity: 0;
        pointer-events: none;       
    }

    .nd-branch-focal {
        opacity: 1;
    }
 
</style>