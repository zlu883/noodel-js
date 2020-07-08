<!--------------------------- TEMPLATE ----------------------------->

<template>

    <div 
        class="nd-noode-box"
    >
        <div
            v-if="useComponentContent"
            ref="noode"
            class="nd-noode"
            :class="noodeClass"
            :style="noodeStyle"
            @wheel="onNoodeWheel"
            @pointerdown="onNoodePointerDown"
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

    import NoodeView from "@/types/NoodeView";
    import { alignBranchOnNoodeResize } from "@/controllers/noodel-align";
    import NoodelView from '@/types/NoodelView';
    import { traverseAncestors } from '../controllers/noodel-traverse';
    import { getPath } from '../util/getters';
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
                this.noode.resizeSensor = new ResizeSensor(this.$el, () => {
                    this.updateRenderedSize();
                });
            })            

            this.applyPreventNav();
        },

        beforeDestroy() {
            if (this.noode.resizeSensor) this.noode.resizeSensor.detach();
            (this.$refs.noode as HTMLDivElement).style.overflow = 'hidden';
            (this.$refs.noode as HTMLDivElement).classList.remove('nd-noode-active');
        },

        methods: {

            updateRenderedSize() {
                let rect = this.$el.getBoundingClientRect();

                alignBranchOnNoodeResize(this.store, this.noode, rect.height);
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
        flex-direction: column;
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
