<!--------------------------- TEMPLATE ----------------------------->

<template>

    <div 
        class="nd-noode" 
    >
        <div
            class="nd-content-box"
            ref="contentBox"
            v-html="noode.content"
            :class="contentBoxClass"
            @wheel="onContentBoxWheel"
            @pointerdown="onContentBoxPointerDown"
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

    import { Component, Prop, Vue, Watch } from "vue-property-decorator";
    import { ResizeSensor } from "css-element-queries";

    import AnimationFade from './AnimationFade.vue';

    import NoodeView from "@/model/NoodeView";
    import { alignBranchOnNoodeSizeChange } from "@/controllers/noodel-align";
    import NoodelView from '../model/NoodelView';
    import { traverseAncestors } from '../controllers/noodel-traverse';

	@Component({
        components: {
            AnimationFade,
        }
    })
	export default class NoodelTrunkBranchNoode extends Vue {

        @Prop() noode: NoodeView;
        @Prop() store: NoodelView;

        mounted() {
            this.$nextTick(() => {
                this.updateRenderedSize();

                new ResizeSensor(this.$el, () => {
                    this.updateRenderedSize();
                });

                this.applyPreventNav();
            });
        }

        @Watch("noode.content")
        onContentUpdated() {
            this.$nextTick(() => {
                this.applyPreventNav();
            });
        }

        updateRenderedSize() {
            alignBranchOnNoodeSizeChange(
                this.noode, 
                this.$el.getBoundingClientRect().height
            );
        }

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
        }

        onContentBoxWheel(ev: WheelEvent) {

            let el = this.$refs.contentBox as HTMLDivElement;

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
        }

        onContentBoxPointerDown(ev: PointerEvent) {

            let el = this.$refs.contentBox as HTMLDivElement;

            // detect click on scrollbar
            if (ev.clientX > el.getBoundingClientRect().left + el.clientWidth ||
            ev.clientY > el.getBoundingClientRect().top + el.clientHeight) {
                ev.stopPropagation();
                return;
            }

            if (this.noode.isActive && this.noode.parent.isFocalParent) {
                this.store.pointerDownSrcContentBox = el;
            }
            
            let path = this.noode.index.toString();

            traverseAncestors(this.noode, noode => {
                path = noode.index + ' ' + path;
            }, false, true);

            this.store.pointerDownSrcNoodePath = path;
        }

        get isFocalActive() {
            return this.noode.parent.isFocalParent && this.noode.isActive;
        }

        get contentBoxClass() {
            return {
                'nd-content-box-active': this.noode.isActive
            }
        }

        get showChildIndicator() {
            return this.noode.children.length > 0;
        }

        get childIndicatorPath() {
            return this.noode.isActive && this.noode.isChildrenVisible
                ? "0 15 60 15 100 50 60 85 0 85"
                : "0 15 40 15 40 85 0 85";
        }

        get childIndicatorClass() {
            return {
                'nd-child-indicator-active': this.noode.isActive
            }
        }
    }

</script>

<!---------------------------- STYLES ------------------------------>

<style>

    .nd-noode {
        box-sizing: border-box !important;
        position: relative;
        padding: 0.2em 0.6em;
        text-align: start;
        margin: 0 !important;
    }

    .nd-content-box {
        height: 100%;
        width: 100%;
        position: relative;
        overflow: auto;
        touch-action: none !important; /* Important as hammerjs will break on mobile without this */
        outline: none;
        overflow-wrap: break-word;
        box-sizing: border-box;
        padding: 1.0em;
        border-radius: 0.4em;
        background-color: #d2edf9;
        transition: background-color 0.5s ease-in;
        line-height: 1.5;
    }

    .nd-content-box-active {
        background-color: #ffffff;
    }

    .nd-content-box > *:first-child {
        margin-top: 0;
    }

    .nd-content-box > *:last-child {
        margin-bottom: 0;
    }

    .nd-child-indicator-box {
        position: absolute;
        height: 1.2em;
        width: 1.2em;
        right: -0.6em;
        top: 50%;
        transform: translateY(-50%);
    }

    .nd-child-indicator {
        fill: #d2edf9;
    }

    .nd-child-indicator-active {
        fill: #ffffff;
    }

    @media (max-width: 800px) {
        .nd-noode {
            max-width: 90vw;
        }
    }

    @media (max-height: 800px) {
        .nd-noode {
            max-height: 90vh;
        }
    }

    @media (min-width: 801px) {
        .nd-noode {
            max-width: 720px;
        }
    }

    @media (min-height: 801px) {
        .nd-noode {
            max-height: 720px;
        }
    }

</style>
