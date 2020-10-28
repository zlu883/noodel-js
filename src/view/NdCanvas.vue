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
			@transitionend="onTrunkTransitionEnd"
		>
			<NdBranch
				v-for="parent in allBranchParents"
				v-show="parent.isBranchVisible || parent.isBranchTransparent"
				:key="parent.id"
				:parent="parent"
				:noodel="noodel"
			/>
		</transition-group>
		<transition-group
			v-if="allBranchBackdropParents.length > 0"
			name="nd-branch-backdrop"
			tag="div"
			class="nd-trunk-backdrop"
			:class="trunkClass"
			:style="trunkStyle"
		>
			<NdBranchBackdrop
				v-for="parent in allBranchBackdropParents"
				v-show="parent.isBranchVisible"
				:key="parent.id"
				:parent="parent"
				:noodel="noodel"
			/>
		</transition-group>
	</div>
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">
import NdBranch from "./NdBranch.vue";
import NdBranchBackdrop from "./NdBranchBackdrop.vue";
import { getFocalHeight, getFocalWidth } from "../controllers/getters";
import { setupCanvasEl } from "../controllers/noodel-setup";
import { setupCanvasInput } from "../controllers/input-binding";
import { traverseDescendents } from "../controllers/noodel-traverse";
import NoodelState from "../types/NoodelState";
import { alignBranchToIndex, alignTrunkToBranch } from "../controllers/noodel-align";
import NoodeState from "../types/NoodeState";
import { PropType, defineComponent } from "vue";
import { queueMount } from "../controllers/event-emit";

export default defineComponent({
	components: {
		NdBranch,
		NdBranchBackdrop
	},

	props: {
		noodel: Object as PropType<NoodelState>,
	},

	mounted: function () {
		this.noodel.r.canvasEl = this.$el as HTMLDivElement;
		this.noodel.r.trunkEl = (this.$refs.trunk as any).$el as HTMLDivElement;
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
						this.noodel.r.isMounted = true;
						queueMount(this.noodel);
					});
				});
			});
		});
	},

	unmounted: function () {
		this.noodel.trunkOffset = 0;
		this.noodel.containerHeight = 0;
		this.noodel.containerWidth = 0;
		this.noodel.r.isMounted = false;

		delete this.noodel.r.canvasEl;
		delete this.noodel.r.trunkEl;

		traverseDescendents(
			this.noodel.root,
			(noode) => {
				noode.trunkRelativeOffset = 0;
				noode.branchRelativeOffset = 0;
				noode.isBranchTransparent = true;
				noode.size = 0;
				noode.branchSize = 0;
				noode.branchOffset = 0;

				delete noode.r.branchEl;
				delete noode.r.el;
				delete noode.r.contentBoxEl;
				delete noode.r.resizeSensor;
				delete noode.r.branchResizeSensor;
			},
			true
		);
	},

	computed: {
		canvasClass(): {} {
			let orientation = this.noodel.options.orientation;
			let branchDirection = this.noodel.options.branchDirection;
			let classes = {};

			classes["nd-canvas-" + orientation] = true;
			classes["nd-canvas-" + branchDirection] = true;

			return classes;
		},

		showLeftLimit(): boolean {
			let orientation = this.noodel.options.orientation;
			let branchDirection = this.noodel.options.branchDirection;

			if (orientation === "ltr") {
				return this.noodel.trunkStartReached;
			}
			else if (orientation === "rtl") {
				return this.noodel.trunkEndReached;
			}
			else {
				if (branchDirection === "normal") {
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

			if (orientation === "ltr") {
				return this.noodel.trunkEndReached;
			}
			else if (orientation === "rtl") {
				return this.noodel.trunkStartReached;
			}
			else {
				if (branchDirection === "normal") {
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

			if (orientation === "ttb") {
				return this.noodel.trunkStartReached;
			}
			else if (orientation === "btt") {
				return this.noodel.trunkEndReached;
			}
			else {
				if (branchDirection === "normal") {
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

			if (orientation === "ttb") {
				return this.noodel.trunkEndReached;
			}
			else if (orientation === "btt") {
				return this.noodel.trunkStartReached;
			}
			else {
				if (branchDirection === "normal") {
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

		allBranchBackdropParents(): NoodeState[] {
			return this.allBranchParents.filter(p => {
				typeof p.options.showBranchBackdrop === 'boolean' ?
					p.options.showBranchBackdrop :
					this.noodel.options.showBranchBackdrops
			});
		},
	},

	methods: {
		onTrunkTransitionEnd(ev: TransitionEvent) {
			if (
				ev.propertyName === "transform" &&
				ev.target === this.noodel.r.trunkEl
			) {
				if (this.noodel.r.ignoreTransitionEnd) return;
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
