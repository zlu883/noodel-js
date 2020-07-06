<!--------------------------- TEMPLATE ----------------------------->

<template>

    <div 
        class="nd-noode-box"
    >
        <div
            ref="noode"
            class="nd-noode"
            :class="noodeClass"
            :style="noodeStyle"
            v-html="noode.content"
            @wheel="onNoodeWheel"
            @pointerdown="onNoodePointerDown"
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

    import AnimationFade from './AnimationFade.vue';

    import NoodeView from "@/types/NoodeView";
    import { alignNoodelOnNoodeResize, alignNoodelOnNoodeInsert } from "@/controllers/noodel-align";
    import NoodelView from '@/types/NoodelView';
    import { traverseAncestors } from '../controllers/noodel-traverse';
    import { getPath } from '../util/getters';
    import Vue, { PropType } from 'vue';
    import Noode from '../main/Noode';

    export default Vue.extend({

        components: {
            AnimationFade,
        },

        props: {
            noode: Object as PropType<NoodeView>,
            store: Object as PropType<NoodelView>
        },

        mounted() {
            this.noode.el = this.$el;
            
            this.$nextTick(() => {
                let rect = this.$el.getBoundingClientRect();

                alignNoodelOnNoodeInsert(this.store, this.noode, rect.width, rect.height);

                if (!this.noode.options.skipResizeDetection) {
                    this.noode.resizeSensor = new ResizeSensor(this.$el, () => {
                        this.updateRenderedSize();
                    });
                }

                // allows parent branch to fall back to display: none after resize sensor setup
                this.noode.parent.isChildrenTransparent = false;
            });
            
            this.applyPreventNav();
        },

        beforeDestroy() {
            if (this.noode.resizeSensor) this.noode.resizeSensor.detach();
            (this.$refs.noode as HTMLDivElement).style.overflow = 'hidden';
            (this.$refs.noode as HTMLDivElement).classList.remove('nd-noode-active');
        },

        methods: {

            updateRenderedSize() {
                if (!this.noode.parent.isChildrenVisible) return;

                let rect = this.$el.getBoundingClientRect();

                alignNoodelOnNoodeResize(this.store, this.noode, rect.width, rect.height);
            },

            applyPreventNav() {
                let prevNavListener = (ev: Event) => {
                    if (this.noode.isActive && this.noode.parent.isFocalParent) {
                        ev.stopPropagation();
                    }
                }

                this.$el.querySelectorAll("[data-prevent-nav-key]").forEach(el => {
                    el.addEventListener("keydown", prevNavListener);
                });
                this.$el.querySelectorAll("[data-prevent-nav-swipe]").forEach(el => {
                    el.addEventListener("pointerdown", prevNavListener);
                });
                this.$el.querySelectorAll("[data-prevent-nav-wheel]").forEach(el => {
                    el.addEventListener("wheel", prevNavListener);
                });
                this.$el.querySelectorAll("[data-prevent-nav-all]").forEach(el => {
                    el.addEventListener("keydown", prevNavListener);
                    el.addEventListener("pointerdown", prevNavListener);
                    el.addEventListener("wheel", prevNavListener);
                });
            },

            onNoodeWheel(ev: WheelEvent) {

                let el = this.$refs.noode as HTMLDivElement;

                if (!(this.noode.isActive && this.noode.parent.isFocalParent)) {
                    return;
                }

                if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) {
                    if (ev.deltaY > 0) {
                        if (Math.abs((el.scrollHeight - el.scrollTop) - el.clientHeight) > 1) {
                            ev.stopPropagation();
                        }
                    }
                    else {
                        if (el.scrollTop !== 0) {
                            ev.stopPropagation();
                        }
                    }
                }
                else {
                    if (ev.deltaX > 0) {
                        if (Math.abs((el.scrollWidth - el.scrollLeft) - el.clientWidth) > 1) {
                            ev.stopPropagation();
                        }
                    }
                    else {
                        if (el.scrollLeft !== 0) {
                            ev.stopPropagation();
                        }
                    }
                }
            },

            onNoodePointerDown(ev: PointerEvent) {

                let el = this.$refs.noode as HTMLDivElement;

                // detect click on scrollbar
                if (ev.clientX > el.getBoundingClientRect().left + el.clientWidth ||
                ev.clientY > el.getBoundingClientRect().top + el.clientHeight) {
                    ev.stopPropagation();
                    return;
                }

                if (this.noode.isActive && this.noode.parent.isFocalParent) {
                    this.store.pointerDownSrcNoodeEl = el;
                }

                this.store.pointerDownSrcNoode = this.noode;
            }
        },

        watch: {
            "noode.content": function() {
                this.$nextTick(() => {
                    this.updateRenderedSize();
                    this.applyPreventNav();
                });
            }
        },

        computed: {

            noodeClass(): any[] {
                return [
                    {
                        'nd-noode-active': this.noode.isActive,
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
        flex-direction: column !important;
    }

    .nd-noode {
        margin: .2em .6em;
        padding: 1em;
        max-height: 100vh;
        max-width: 100vw;
        box-sizing: border-box;
        touch-action: none !important; /* Important as hammerjs will break on mobile without this */
        overflow: auto;
        background-color: #e6e6e6;
        transition-property: background-color;
        transition-duration: .5s;
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
    }

    .nd-noode-active {
        background-color: #ffffff;
    }

    .nd-noode-enter, .nd-noode-leave-active {
        opacity: 0;
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

</style>
