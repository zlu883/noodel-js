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
            :style="noodeStyle"
            @wheel="onNoodeWheel"
            @pointerdown="onNoodePointerDown"
        >
        </div>   
        <AnimationFade>
            <div
                v-if="showChildIndicator"
                class="nd-child-indicator-box"
            >
                <div 
                    class="nd-child-indicator"
                    :class="childIndicatorClass"
                >
                </div>
            </div>  
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
        height: 1em;
        width: 1.3em;
        right: -0.6em;
        top: 50%;
        transform: translateY(-50%);
    }

    .nd-child-indicator {
        width: .6em;
        height: 100%;
        background-color: #e6e6e6;
        position: relative;
    }

    .nd-child-indicator-active {
        background-color: #ffffff;
        width: .8em;
    }

    .nd-child-indicator-active::after {
        content: "";
        position: absolute;
        left: .8em;
        bottom: 0;
        width: 0;
        height: 0;
        border-left: .5em solid white;
        border-top: .5em solid transparent;
        border-bottom: .5em solid transparent;
    }


</style>
