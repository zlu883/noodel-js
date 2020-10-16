<!--------------------------- TEMPLATE ----------------------------->

<template>

    <div
        :id="parent.id"
        class="nd-branch-box"
        :class="branchBoxClass"
        :style="branchBoxStyle"
    >
        <div
            v-if="showBranchBackdrop"
            class="nd-branch-backdrop"
            :class="branchBackdropClass"
        />
        <div 
            class="nd-branch" 
            ref="branch"
            :class="branchClass"
            :style="branchStyle"
            @transitionend="onTransitionEnd"
        >  
            <NoodeTransitionGroup
                :noodel="noodel"
                :parent="parent"
            />
        </div>
    </div>
    
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">

    import NoodeTransitionGroup from './NoodeTransitionGroup.vue';
    import { getFocalHeight, getFocalWidth } from '../controllers/getters';
    import NoodeState from '../types/NoodeState';
    import NoodelState from '../types/NoodelState';
    import Vue, { PropType } from 'vue';
    import { updateBranchSize } from '../controllers/noodel-align';
    import { attachBranchResizeSensor, detachBranchResizeSensor } from '../controllers/resize-detect';

    export default Vue.extend({
        
        components: {
            NoodeTransitionGroup
        },

        props: {
            parent: Object as PropType<NoodeState>,
            noodel: Object as PropType<NoodelState>
        },

        mounted() {
            this.parent.branchBoxEl = this.$el as HTMLDivElement;
            this.parent.branchEl = this.$refs.branch as HTMLDivElement;

            let branchRect = this.parent.branchBoxEl.getBoundingClientRect();
            
            updateBranchSize(this.noodel, this.parent, branchRect.height, branchRect.width, true);
            attachBranchResizeSensor(this.noodel, this.parent); 
        },

        beforeDestroy() {
            detachBranchResizeSensor(this.parent);
            this.parent.branchEl = null;
            this.parent.branchBoxEl = null;
        },

        computed: {

            branchBoxStyle(): {} {
                let orientation = this.noodel.options.orientation;
                let branchDirection = this.noodel.options.branchDirection;
                let style = {};

                if (orientation === 'ltr') {
                    style['left'] = 0;
                    style['height'] = '100%';
                    style['transform'] = `translateX(${this.parent.trunkRelativeOffset}px)`;
                    style['flex-direction'] = branchDirection === 'normal' ? 'column' : 'column-reverse';
                }
                else if (orientation === "rtl") {
                    style['right'] = 0;
                    style['height'] = '100%';
                    style['transform'] = `translateX(${-this.parent.trunkRelativeOffset}px)`;
                    style['flex-direction'] = branchDirection === 'normal' ? 'column' : 'column-reverse';
                }
                else if (orientation === "ttb") {
                    style['top'] = 0;
                    style['width'] = '100%';
                    style['transform'] = `translateY(${this.parent.trunkRelativeOffset}px)`;
                    style['flex-direction'] = branchDirection === 'normal' ? 'row' : 'row-reverse';
                }
                else if (orientation === "btt") {
                    style['bottom'] = 0;
                    style['width'] = '100%';
                    style['transform'] = `translateY(${-this.parent.trunkRelativeOffset}px)`;
                    style['flex-direction'] = branchDirection === 'normal' ? 'row' : 'row-reverse';
                }

                style['pointer-events'] = !this.parent.isBranchVisible ? 'none' : null;
                style['opacity'] = !this.parent.isBranchVisible && this.parent.isBranchTransparent ? 0 : null;

                return style;
            },

            branchStyle(): {} {
                let orientation = this.noodel.options.orientation;
                let branchDirection = this.noodel.options.branchDirection;
                let style = {};

                if (orientation === 'ltr' || orientation === 'rtl') {
                    if (branchDirection === 'normal') {
                        style['transform'] = `translateY(${-this.parent.branchOffset + getFocalHeight(this.noodel)}px)`;
                    }
                    else if (branchDirection === 'reverse') {
                        style['transform'] = `translateY(${this.parent.branchOffset - getFocalHeight(this.noodel)}px)`;
                    }
                }
                else if (orientation === "ttb" || orientation === 'btt') {
                    if (branchDirection === 'normal') {
                        style['transform'] = `translateX(${-this.parent.branchOffset + getFocalWidth(this.noodel)}px)`;
                    }
                    else if (branchDirection === 'reverse') {
                        style['transform'] = `translateX(${this.parent.branchOffset - getFocalWidth(this.noodel)}px)`;
                    }
                }

                return style;
            },

            branchBoxClass(): {} {
                return {
                    'nd-branch-box-focal': this.parent.isFocalParent
                }
            },

            branchBackdropClass(): {} {
                return {
                    'nd-branch-backdrop-focal': this.parent.isFocalParent
                }
            },

            branchClass(): {} {
                return {
                    'nd-branch-move': this.parent.applyBranchMove,
                    'nd-branch-focal': this.parent.isFocalParent
                }
            },

            showBranchBackdrop(): boolean {
                return typeof this.parent.options.showBranchBackdrop === 'boolean'
                    ? this.parent.options.showBranchBackdrop
                    : this.noodel.options.showBranchBackdrops;
            }
        },

        methods: {

            onTransitionEnd(ev: TransitionEvent) {
                if (ev.propertyName === "transform" && ev.target === this.$refs.branch) {
                    if (this.parent.ignoreTransitionEnd) return;
                    this.parent.applyBranchMove = false;
                }
            },
        }
        
    });
    
</script>

<!---------------------------- STYLES ------------------------------>

<style>

    .nd-branch-box {
        position: absolute;
        box-sizing: border-box !important;
        display: flex;
        z-index: 1;
    }

    .nd-branch-box-focal {
        z-index: 10;
    }

    .nd-branch-box-leave {
        opacity: 1;
    }

    .nd-branch-box-enter, .nd-branch-box-leave-active {
        opacity: 0;
    }

    .nd-branch-box-enter-active, .nd-branch-box-leave-active {
        transition-property: opacity;
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000); /* easeOutCubic from Penner equations */
        transition-duration: .5s; 
    }

    .nd-branch-backdrop {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
    }

    .nd-branch {
        position: relative;
    }

    .nd-branch-move {
        transition-property: transform;
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000); /* easeOutCubic from Penner equations */
        transition-duration: .5s; 
    }

</style>