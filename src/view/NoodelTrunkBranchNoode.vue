<!--------------------------- TEMPLATE ----------------------------->

<template>

    <div 
        class="nd-noode-box"
    >
        <div
            class="nd-noode"
            ref="noode"
            v-html="noode.content"
            :class="noodeClass"
            @wheel="onNoodeWheel"
            @pointerdown="onNoodePointerDown"
        >
        </div>   
        <AnimationFade>   
            <svg 
                v-if="showChildIndicator" 
                class="nd-child-indicator-box"
                viewBox="0 0 100 100"
            >
                <polygon
                    class="nd-child-indicator"
                    :class="childIndicatorClass"
                    :points="childIndicatorPath" 
                />
            </svg>
        </AnimationFade>
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

            noodeClass(): {} {
                return {
                    'nd-noode-active': this.noode.isActive,
                }
            },

            showChildIndicator(): {} {
                return this.noode.children.length > 0;
            },

            childIndicatorPath(): {} {
                return this.noode.isActive && this.noode.isChildrenVisible
                    ? "0 15 60 15 100 50 60 85 0 85"
                    : "0 15 40 15 40 85 0 85";
            },

            childIndicatorClass(): {} {
                return {
                    'nd-child-indicator-active': this.noode.isActive,
                }
            }
        }
    });

</script>

<!---------------------------- STYLES ------------------------------>

<style>

    .nd-noode-box {
        box-sizing: border-box !important;
        position: relative;
        padding: 0.2em 0.6em;
        text-align: start;
        margin: 0 !important;
        transform: translateY(0);
        transition-property: opacity, transform;
        transition-duration: .5s;
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
    }

    .nd-noode {
        position: relative;
        overflow: auto;
        touch-action: none !important; /* Important as hammerjs will break on mobile without this */
        outline: none;
        overflow-wrap: break-word;
        box-sizing: border-box;
        padding: 1.0em;
        border-radius: 0.4em;
        background-color: #e6e6e6;
        transition-property: background-color;
        transition-duration: .5s;
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
        line-height: 1.5;
        max-height: 100vh;
        max-width: 100vw;
    }

    .nd-noode-active {
        background-color: #ffffff;
    }

    .nd-noode > *:first-child {
        margin-top: 0;
    }

    .nd-noode > *:last-child {
        margin-bottom: 0;
    }

    .nd-child-indicator-box {
        position: absolute;
        height: 1.2em;
        width: 1.2em;
        right: -0.6em;
        top: 50%;
        transform: translateY(-50%);
        transition-property: opacity;
        transition-duration: 0.5s;
        transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
    }

    .nd-child-indicator {
        fill: #e6e6e6;
        opacity: 1;
    }

    .nd-child-indicator-active {
        fill: #ffffff;
    }


</style>
