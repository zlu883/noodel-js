<!--------------------------- TEMPLATE ----------------------------->

<template>

    <div 
        class="nd-noode-box"
        :class="noodeBoxClass"
    >
        <transition name="nd-inspect-backdrop">
            <div
                class="nd-inspect-backdrop"
                :style="backdropStyle"
                v-if="noode.isInInspectMode"
            >
            </div>
        </transition>
        <div
            v-if="useComponentContent"
            ref="noode"
            class="nd-noode"
            :class="noodeClass"
            :style="noodeStyle"
            @pointerup="onPointerUp"
            @mouseup="onPointerUp"
            @touchend="onPointerUp"
        >
            <component 
                :is="noode.content.component" 
                v-bind="noode.content.props"
                v-on="noode.content.eventListeners"
            />
        </div>   
        <div
            v-else
            ref="noode"
            class="nd-noode"
            :class="noodeClass"
            :style="noodeStyle"
            v-html="noode.content"
            @pointerup="onPointerUp"
            @mouseup="onPointerUp"
            @touchend="onPointerUp"
        >
        </div>
        <transition name="nd-child-indicator">
            <div
                v-if="showChildIndicator"
                class="nd-child-indicator"
                :class="childIndicatorClass"
            >
            </div>  
        </transition>
    </div>

</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">

    import { ResizeSensor } from "css-element-queries";

    import NoodeView from "@/types/NoodeView";
    import { alignBranchOnNoodeResize } from "@/controllers/noodel-align";
    import NoodelView from '@/types/NoodelView';
    import { traverseAncestors } from '../controllers/noodel-traverse';
    import { getPath, getFocalHeight, getFocalWidth } from '../util/getters';
    import Vue, { PropType } from 'vue';
    import Noode from '../main/Noode';

    export default Vue.extend({

        props: {
            noode: Object as PropType<NoodeView>,
            store: Object as PropType<NoodelView>
        },

        mounted() {         
            this.noode.el = this.$el;

            // nextTick is required for vue's v-move effect to work
            Vue.nextTick(() => {
                // do initial size capture
                let rect = this.$el.getBoundingClientRect();

                alignBranchOnNoodeResize(this.store, this.noode, rect.height, true);

                // allows parent branch to fall back to display: none after first size update,
                // using nextTick to wait for parent branch size capture to finish first
                Vue.nextTick(() => this.noode.parent.isChildrenTransparent = false);

                // setup resize sensor, first callback will run after Vue.nextTick
                if (this.noode.options.skipResizeDetection || this.store.options.skipResizeDetection) return;
                this.noode.resizeSensor = new ResizeSensor(this.$el, () => {
                    this.updateRenderedSize();
                });
            });            

            this.applyPreventNav();
        },

        beforeDestroy() {
            if (this.noode.resizeSensor) this.noode.resizeSensor.detach();
            (this.$refs.noode as HTMLDivElement).style.overflow = 'hidden';
            (this.$refs.noode as HTMLDivElement).classList.remove('nd-noode-active');
        },

        methods: {

            onPointerUp() {
                if (this.store.pointerUpSrcNoode) return;
                this.store.pointerUpSrcNoode = this.noode;
                requestAnimationFrame(() => this.store.pointerUpSrcNoode = null);
            },

            updateRenderedSize() {
                let rect = this.$el.getBoundingClientRect();

                alignBranchOnNoodeResize(this.store, this.noode, rect.height);
            },

            applyPreventNav() {
                let preventInput = (ev: Event) => ev.stopPropagation();

                this.$el.querySelectorAll("[data-prevent-key]").forEach(el => {
                    el.addEventListener("keydown", preventInput);
                });
                this.$el.querySelectorAll("[data-prevent-swipe]").forEach(el => {
                    el.addEventListener("pointerdown", preventInput);
                });
                this.$el.querySelectorAll("[data-prevent-wheel]").forEach(el => {
                    el.addEventListener("wheel", preventInput);
                });
                this.$el.querySelectorAll("[data-prevent-tap]").forEach(el => {
                    el.addEventListener("pointerdown", preventInput);
                });
            },
        },

        watch: {
            "noode.content": function() {
                this.$nextTick(() => {
                    if (this.noode.parent.isChildrenVisible) {
                        this.updateRenderedSize();
                    }

                    this.applyPreventNav();
                });
            }
        },

        computed: {

            useComponentContent(): boolean {
                return this.noode.content && (typeof this.noode.content === 'object');
            },

            noodeBoxClass(): {} {
                return {
                    'nd-noode-box-active': this.noode.isActive
                }
            },

            backdropStyle(): {} {
                return {
                    left: '50%',
                    top: '50%',
                    width: `${this.store.containerSize.x + 10}px`,
                    height: `${this.store.containerSize.y + 10}px`,
                    transform: `translate(${-getFocalWidth(this.store) - 5}px, ${-getFocalHeight(this.store) - 5}px)`
                }
            },

            noodeClass(): any[] {
                return [
                    {
                        'nd-noode-active': this.noode.isActive,
                        'nd-noode-inspect': this.noode.isInInspectMode
                    },
                    ...this.noode.className
                ]
            },

            noodeStyle(): {} {
                return this.noode.style;
            },

            showChildIndicator(): {} {
                return this.noode.children.length > 0;
            },

            childIndicatorClass(): {} {
                return {
                    'nd-child-indicator-active': this.noode.isActive
                }
            }
        }
    });

</script>

<!---------------------------- STYLES ------------------------------>

<style>

    .nd-noode-box {
        box-sizing: border-box !important;
        margin: 0 !important; /* Must have no margin for size tracking to work properly */
        position: relative;
        display: flex !important; /* Prevents margin collapse */
        flex-direction: column;
        z-index: 1;
    }

    .nd-noode-box-active {
        z-index: 10;
    }

    .nd-inspect-backdrop {
        position: absolute;
        z-index: 1;
        background-color: rgba(0, 0, 0, 0.4);
        cursor: auto;
    }

    .nd-noode {
        margin: .2em .6em;
        padding: 1em;
        max-height: 600px;
        max-width: 800px;
        box-sizing: border-box;
        touch-action: none; /* Important as hammerjs will break on mobile without this */
        overflow: hidden;
        background-color: #e6e6e6;
        transition-property: background-color;
        transition-duration: .5s;
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
        z-index: 10;
    }

    .nd-noode-active {
        background-color: #ffffff;
    }

    .nd-noode-inspect {
        overflow: auto; 
        user-select: text;
        -webkit-user-select: text;
        -khtml-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        cursor: auto;
        touch-action: auto;
        overscroll-behavior: none;
    }

    .nd-noode-enter, .nd-noode-leave-active {
        opacity: 0;
    }

    .nd-noode-leave-active {
        position: absolute;
        width: 100%;
    }

    .nd-noode-enter-active, .nd-noode-leave-active {
        transition-property: opacity;
        transition-duration: .5s;
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
    }

    .nd-noode-move {
        transition-property: opacity, transform;
        transition-duration: .5s;
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
    }

    .nd-child-indicator {
        position: absolute;
        height: 1em;
        width: .6em;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        background-color: #e6e6e6;
        z-index: 100;
    }

    .nd-child-indicator-active {
        background-color: #ffffff;
    }

    .nd-child-indicator-active::after {
        content: "";
        position: absolute;
        left: .6em;
        bottom: 0;
        width: 0;
        height: 0;
        border-left: .5em solid #ffffff;
        border-top: .5em solid transparent;
        border-bottom: .5em solid transparent;
    }

    .nd-child-indicator-enter, .nd-child-indicator-leave-active {
        opacity: 0;
    }

    .nd-child-indicator-enter-active, .nd-child-indicator-leave-active {
        transition-property: opacity;
        transition-duration: .5s;
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
    }

    .nd-inspect-backdrop-enter, .nd-inspect-backdrop-leave-active {
        opacity: 0;
    }

    .nd-inspect-backdrop-enter-active, .nd-inspect-backdrop-leave-active {
        transition-property: opacity;
        transition-duration: .5s;
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
    }

</style>
