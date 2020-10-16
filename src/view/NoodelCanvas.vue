<!--------------------------- TEMPLATE ----------------------------->

<template>
	<div 
		class="nd-canvas"
		:class="canvasClass"
		tabindex="0" 
		@dragstart="onDragStart"
	>
		<transition name="nd-limit">
			<div
				class="nd-limit nd-limit-left"
				v-if="noodel.options.showLimitIndicators"
				v-show="showLeftLimit"
			/>
		</transition>
		<transition name="nd-limit">
			<div
				class="nd-limit nd-limit-right"
				v-if="noodel.options.showLimitIndicators"
				v-show="showRightLimit"
			/>
		</transition>
		<transition name="nd-limit">
			<div
				class="nd-limit nd-limit-top"
				v-if="noodel.options.showLimitIndicators"
				v-show="showTopLimit"
			/>
		</transition>
		<transition name="nd-limit">
			<div
				class="nd-limit nd-limit-bottom"
				v-if="noodel.options.showLimitIndicators"
				v-show="showBottomLimit"
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
				v-show="parent.isBranchVisible || parent.isBranchTransparent"
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

	import { getFocalHeight, getFocalWidth } from "../controllers/getters";
	import { setupCanvasEl } from "../controllers/noodel-setup";
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
			this.noodel.canvasEl = this.$el as HTMLDivElement;
			this.noodel.trunkEl = (this.$refs.trunk as any).$el as HTMLDivElement;
			setupCanvasEl(this.noodel);
			setupCanvasInput(this.noodel);

			this.$nextTick(() => {
				this.allBranchParents.forEach((parent) => {
					alignBranchToIndex(parent, parent.activeChildIndex);
				});

				alignTrunkToBranch(this.noodel, this.noodel.focalParent);

				// use triple RAF to ensure that all side effects (e.g. resize sensor callbacks)
				// are finished
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						requestAnimationFrame(() => {
							this.noodel.isMounted = true;

							if (typeof this.noodel.options.onMount === "function") {
								this.noodel.options.onMount();
							}
						});
					});
				});
			});
		},

		destroyed: function () {
			this.noodel.trunkOffset = 0;
			this.noodel.containerHeight = 0;
			this.noodel.containerWidth = 0;
			this.noodel.isMounted = false;

			delete this.noodel.canvasEl;
			delete this.noodel.trunkEl;

			traverseDescendents(
				this.noodel.root,
				(noode) => {
					noode.trunkRelativeOffset = 0;
					noode.branchRelativeOffset = 0;
					noode.isBranchTransparent = true;
					noode.size = 0;
					noode.branchSize = 0;
					noode.branchOffset = 0;

					delete noode.branchEl;
					delete noode.branchBoxEl;
					delete noode.el;
					delete noode.boxEl;
					delete noode.resizeSensor;
					delete noode.branchResizeSensor;
				},
				true
			);
		},

		computed: {
			canvasClass(): {} {
				let orientation = this.noodel.options.orientation;
				let branchDirection = this.noodel.options.branchDirection;
				let classes = {};

				classes['nd-canvas-' + orientation] = true;
				classes['nd-canvas-' + branchDirection] = true;
				
				return classes;
			},

			showLeftLimit(): boolean {
				let orientation = this.noodel.options.orientation;
				let branchDirection = this.noodel.options.branchDirection;

				if (orientation === 'ltr') {
					return this.noodel.trunkStartReached;
				}
				else if (orientation === 'rtl') {
					return this.noodel.trunkEndReached;
				}
				else {
					if (branchDirection === 'normal') {
						return this.noodel.branchStartReached;
					}
					else {
						return this.noodel.branchEndReached;
					}
				}
			},

			showRightLimit(): boolean {
				let orientation = this.noodel.options.orientation;
				let branchDirection = this.noodel.options.branchDirection;

				if (orientation === 'ltr') {
					return this.noodel.trunkEndReached;
				}
				else if (orientation === 'rtl') {
					return this.noodel.trunkStartReached;
				}
				else {
					if (branchDirection === 'normal') {
						return this.noodel.branchEndReached;
					}
					else {
						return this.noodel.branchStartReached;
					}
				}
			},

			showTopLimit(): boolean {
				let orientation = this.noodel.options.orientation;
				let branchDirection = this.noodel.options.branchDirection;

				if (orientation === 'ttb') {
					return this.noodel.trunkStartReached;
				}
				else if (orientation === 'btt') {
					return this.noodel.trunkEndReached;
				}
				else {
					if (branchDirection === 'normal') {
						return this.noodel.branchStartReached;
					}
					else {
						return this.noodel.branchEndReached;
					}
				}
			},

			showBottomLimit(): boolean {
				let orientation = this.noodel.options.orientation;
				let branchDirection = this.noodel.options.branchDirection;

				if (orientation === 'ttb') {
					return this.noodel.trunkEndReached;
				}
				else if (orientation === 'btt') {
					return this.noodel.trunkStartReached;
				}
				else {
					if (branchDirection === 'normal') {
						return this.noodel.branchEndReached;
					}
					else {
						return this.noodel.branchStartReached;
					}
				}
			},

			trunkStyle(): {} {
				let orientation = this.noodel.options.orientation;
				let transform: string = null;

				if (orientation === "ltr") {
					transform = `translateX(${getFocalWidth(this.noodel) - this.noodel.trunkOffset}px)`;
                }
                else if (orientation === "rtl") {
					transform = `translateX(${-getFocalWidth(this.noodel) + this.noodel.trunkOffset}px)`;
				}
				else if (orientation === "ttb") {
					transform = `translateY(${getFocalHeight(this.noodel) - this.noodel.trunkOffset}px)`;
				}
				else if (orientation === "btt") {
					transform = `translateY(${-getFocalHeight(this.noodel) + this.noodel.trunkOffset}px)`;
				}
				
				return { transform };
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
					ev.target === this.noodel.trunkEl
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
