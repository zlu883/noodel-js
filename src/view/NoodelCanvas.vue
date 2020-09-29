<!--------------------------- TEMPLATE ----------------------------->

<template>
	<div class="nd-canvas" ref="canvas" tabindex="0" @dragstart="onDragStart">
		<transition name="nd-limit">
			<div
				class="nd-limit nd-limit-left"
				v-if="noodel.options.showLimitIndicators"
				v-show="noodel.showLeftLimit"
			/>
		</transition>
		<transition name="nd-limit">
			<div
				class="nd-limit nd-limit-right"
				v-if="noodel.options.showLimitIndicators"
				v-show="noodel.showRightLimit"
			/>
		</transition>
		<transition name="nd-limit">
			<div
				class="nd-limit nd-limit-top"
				v-if="noodel.options.showLimitIndicators"
				v-show="noodel.showTopLimit"
			/>
		</transition>
		<transition name="nd-limit">
			<div
				class="nd-limit nd-limit-bottom"
				v-if="noodel.options.showLimitIndicators"
				v-show="noodel.showBottomLimit"
			/>
		</transition>
		<transition-group
			name="nd-branch-box"
			tag="div"
			ref="trunk"
			class="nd-trunk"
			:class="trunkClass"
			:style="trunkStyle"
			@transitionend.native="onTransitionEnd"
		>
			<NoodelCanvasTrunkBranch
				v-for="parent in allBranchParents"
				v-show="
					parent.isChildrenVisible || parent.isChildrenTransparent
				"
				:key="parent.id"
				:parent="parent"
				:noodel="noodel"
			/>
		</transition-group>
	</div>
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">
	import NoodelCanvasTrunkBranch from "./NoodelCanvasTrunkBranch.vue";

	import { getFocalWidth } from "../controllers/getters";
	import { setupContainer } from "../controllers/noodel-setup";
	import { setupCanvasInput } from "../controllers/input-binding";
	import { traverseDescendents } from "../controllers/noodel-traverse";
	import NoodelState from "../types/NoodelState";
	import {
		alignBranchToIndex,
		alignTrunkToBranch,
	} from "../controllers/noodel-align";
	import NoodeState from "../types/NoodeState";
	import Vue, { PropType } from "vue";

	export default Vue.extend({
		components: {
			NoodelCanvasTrunkBranch,
		},

		props: {
			noodel: Object as PropType<NoodelState>,
		},

		mounted: function () {
			setupContainer(this.$el, this.noodel);
			setupCanvasInput(this.$el as HTMLDivElement, this.noodel);
			this.noodel.trunkEl = (this.$refs.trunk as any).$el as Element;
			this.noodel.canvasEl = this.$refs.canvas as Element;

			this.$nextTick(() => {
				this.allBranchParents.forEach((parent) => {
					alignBranchToIndex(parent, parent.activeChildIndex);
				});

				alignTrunkToBranch(this.noodel, this.noodel.focalParent);

				requestAnimationFrame(() => {
					this.$nextTick(() => {
						this.noodel.isFirstRenderDone = true;

						if (typeof this.noodel.options.onMount === "function") {
							this.noodel.options.onMount();
						}
					});
				});
			});
		},

		destroyed: function () {
			this.noodel.trunkOffset = 0;
			this.noodel.trunkOffsetAligned = 0;
			this.noodel.containerHeight = 0;
			this.noodel.containerWidth = 0;
			this.noodel.isFirstRenderDone = false;

			delete this.noodel.canvasEl;
			delete this.noodel.trunkEl;

			traverseDescendents(
				this.noodel.root,
				(noode) => {
					noode.trunkRelativeOffset = 0;
					noode.branchRelativeOffset = 0;
					noode.isChildrenTransparent = true;
					noode.size = 0;
					noode.branchSize = 0;
					noode.childBranchOffset = 0;
					noode.childBranchOffsetAligned = 0;

					delete noode.branchEl;
					delete noode.branchBoxEl;
					delete noode.el;
					delete noode.resizeSensor;
					delete noode.branchResizeSensor;
				},
				true
			);
		},

		computed: {
			trunkStyle(): {} {
				let orientation = this.noodel.options.orientation;

				if (orientation === "ltr") {
					return {
						transform: `translateX(${this.noodel.trunkOffset + getFocalWidth(this.noodel)}px)`,
					};
                }
                else if (orientation === "rtl") {
                    return {
						transform: `translateX(${-this.noodel.trunkOffset + getFocalWidth(this.noodel)}px)`,
					};
                }
			},

			trunkClass(): {} {
				return {
					"nd-trunk-move": this.noodel.applyTrunkMove,
				};
			},

			allBranchParents(): NoodeState[] {
				let allBranchParents: NoodeState[] = [];

				traverseDescendents(
					this.noodel.root,
					(desc) => {
						if (desc.children.length > 0) {
							allBranchParents.push(desc);
						}
					},
					true
				);

				return allBranchParents;
			},
		},

		methods: {
			onTransitionEnd(ev: TransitionEvent) {
				if (
					ev.propertyName === "transform" &&
					ev.target === (this.$refs.trunk as any).$el
				) {
					if (this.noodel.ignoreTransitionEnd) return;
					this.noodel.applyTrunkMove = false;
				}
			},

			onDragStart(ev: DragEvent) {
				if (this.noodel.isInInspectMode) return;
				ev.preventDefault();
			},
		},
	});
</script>

<!---------------------------- STYLES ------------------------------>

<style>
	.nd-canvas {
		position: relative;
		width: 800px;
		height: 600px;
		overflow: hidden;
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		-khtml-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
		cursor: grab;
		background-color: #a6a6a6;
		overscroll-behavior: none;
	}

	.nd-limit {
		position: absolute;
		z-index: 9999;
		border: solid 0px;
		background-color: #595959;
	}

	.nd-limit-enter,
	.nd-limit-leave-active {
		opacity: 0;
	}

	.nd-limit-enter-active,
	.nd-limit-leave-active {
		transition-property: opacity;
		transition-duration: 0.5s;
		transition-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
	}

	.nd-limit-left {
		top: 0;
		left: 0;
		height: 100%;
		width: 1em;
	}

	.nd-limit-right {
		top: 0;
		right: 0;
		height: 100%;
		width: 1em;
	}

	.nd-limit-top {
		top: 0;
		left: 0;
		height: 1em;
		width: 100%;
	}

	.nd-limit-bottom {
		bottom: 0;
		left: 0;
		height: 1em;
		width: 100%;
	}

	.nd-trunk {
		position: relative;
		height: 100%;
		width: 100%;
	}

	.nd-trunk-move {
		transition-property: transform;
		transition-duration: 0.5s;
		transition-timing-function: cubic-bezier(
			0.215,
			0.61,
			0.355,
			1
		); /* easeOutCubic from Penner equations */
	}
</style>
