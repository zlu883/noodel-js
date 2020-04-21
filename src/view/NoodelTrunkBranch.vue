<!--------------------------- TEMPLATE ----------------------------->

<template>
    <div 
        class="nd-branch" 
        :style="branchStyle"
        :class="branchClass"
    >  
        <div 
            class="nd-slider"
            :class="sliderClass"
            ref="slider"
            :style="sliderStyle"
        >
            <NoodelTrunkBranchNoode
                v-for="(child, index) in parent.children"
                :key="child.id"
                :noode="child" 
                :index="index"
                :path="path + ' ' + index"
                :store="store"
            />
        </div>
        <NoodelTrunkBranch
            v-for="child in childrenWithDescendents"
            :key="child.noode.id"
            :parent="child.noode"
            :level="level + 1"
            :path="path + ' ' + child.index"
            :offset="parent.branchSize"
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

    import { getFocalHeight, getActiveChild } from '@/getters/getters';
    import NoodeView from '@/model/NoodeView';
    import { alignTrunkOnBranchSizeChange } from '@/controllers/noodel-align';
    import NoodelView from '@/model/NoodelView';

	@Component({
        name: 'NoodelTrunkBranch', // necessary for recursion
        components: {
            NoodelTrunkBranchNoode,
            NoodelTrunkBranch,
            AnimationFade
        }
    })
	export default class NoodelTrunkBranch extends Vue {

        @Prop() parent: NoodeView;
        @Prop() offset: number;
        @Prop() level: number;
        @Prop() path: string;

        @Prop() store: NoodelView;

        mounted() {
            this.$nextTick(() => {
                this.updateRenderedSize();
                new ResizeSensor(this.$refs.slider as Element, () => {
                    this.updateRenderedSize();
                }); 
            });     
        }

        updateRenderedSize() {  
            alignTrunkOnBranchSizeChange(
                this.parent, 
                (this.$refs.slider as Element).getBoundingClientRect().width, 
                this.level,
                this.store
            );
        }

        get branchStyle() {
            return {
                left: this.offset + 'px',
            }
        }

        get branchClass() {
            return {
                'nd-branch-hidden': !this.parent.isChildrenVisible
            }
        }

        get sliderStyle() {
            return {
                transform: 'translateY(' + (this.parent.branchOffset + getFocalHeight(this.store)) + 'px)'
            }
        }

        get sliderClass() {
            return {
                "nd-slider-focal": this.parent.isFocalParent
            }
        }

        get childrenWithDescendents() {
            // also maps the original index to the filtered array
            return this.parent.children.map((noode, index) => {return {noode, index}}).filter(c => c.noode.children.length > 0);
        }
    }
    
</script>

<!---------------------------- STYLES ------------------------------>

<style>
    
    .nd-branch {
        position: relative; /** Not absolute, important trick to make noodes flexible inside slider */
        transition: opacity 0.3s ease-in;
    }

    .nd-branch-hidden {
        opacity: 0;
        pointer-events: none;       
    }

    .nd-slider {
        display: flex;
        transition: opacity 0.3s ease-in;
        position: absolute;
        z-index: 100;
        flex-direction: column;
        opacity: 0.75;
    }

    .nd-slider-focal {
        opacity: 1;
    }
 
</style>