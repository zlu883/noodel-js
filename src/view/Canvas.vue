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
				:class="leftLimitClass"
			/>
		</transition>
		<transition name="nd-limit">
			<div
				class="nd-limit nd-limit-right"
				v-if="noodel.options.showLimitIndicators"
				v-show="showRightLimit"
				:class="rightLimitClass"
			/>
		</transition>
		<transition name="nd-limit">
			<div
				class="nd-limit nd-limit-top"
				v-if="noodel.options.showLimitIndicators"
				v-show="showTopLimit"
				:class="topLimitClass"
			/>
		</transition>
		<transition name="nd-limit">
			<div
				class="nd-limit nd-limit-bottom"
				v-if="noodel.options.showLimitIndicators"
				v-show="showBottomLimit"
				:class="bottomLimitClass"
			/>
		</transition>
		<div
			ref="trunk"
			class="nd-trunk"
			:class="trunkClass"
			:style="trunkStyle"
		>
			<BranchTransitionGroup
				:allParents="allBranchParents"
				:noodel="noodel"
			/>
		</div>
	</div>
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">
import BranchTransitionGroup from "./BranchTransitionGroup.vue";
import { setupCanvasEl } from "../controllers/noodel-setup";
import { setupCanvasInput } from "../controllers/input-binding";
import { traverseDescendents } from "../controllers/noodel-traverse";
import NoodelState from "../types/NoodelState";
import NodeState from "../types/NodeState";
import { PropType, defineComponent } from "vue";
import { queueMount } from "../controllers/event-emit";
import { getActualOffsetTrunk } from '../controllers/getters';

export default defineComponent({
	components: {
		BranchTransitionGroup,
	},

	props: {
		noodel: Object as PropType<NoodelState>,
	},

	mounted: function () {
		this.noodel.r.canvasEl = this.$el as HTMLDivElement;
		this.noodel.r.trunkEl = (this.$refs.trunk as any) as HTMLDivElement;
		setupCanvasEl(this.noodel);
		setupCanvasInput(this.noodel);

		// use double RAF to ensure that all side effects (e.g. size captures)
		// are finished
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				this.noodel.isMounted = true;
				queueMount(this.noodel);
			});
		});
	},

	unmounted: function () {
		this.noodel.canvasSizeBranch = 0;
		this.noodel.canvasSizeTrunk = 0;
		this.noodel.isMounted = false;
		this.noodel.applyTrunkMove = false;
		this.noodel.r.canvasEl = null;
		this.noodel.r.trunkEl = null;
	},

	computed: {
		canvasClass(): {} {
			let classes = `nd-canvas-${this.noodel.options.orientation} nd-canvas-${this.noodel.options.branchDirection}`;

			if (this.noodel.isInInspectMode) {
				classes += ' nd-canvas-inspect';
			}

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

		leftLimitClass(): string {
			let orientation = this.noodel.options.orientation;
			let branchDirection = this.noodel.options.branchDirection;

			if (orientation === "ltr") {
				return 'nd-limit-trunk-start';
			}
			else if (orientation === "rtl") {
				return 'nd-limit-trunk-end';
			}
			else {
				if (branchDirection === "normal") {
					return 'nd-limit-branch-start';
				}
				else {
					return 'nd-limit-branch-end';
				}
			}
		},

		rightLimitClass(): string {
			let orientation = this.noodel.options.orientation;
			let branchDirection = this.noodel.options.branchDirection;

			if (orientation === "ltr") {
				return 'nd-limit-trunk-end';
			}
			else if (orientation === "rtl") {
				return 'nd-limit-trunk-start';
			}
			else {
				if (branchDirection === "normal") {
					return 'nd-limit-branch-end';
				}
				else {
					return 'nd-limit-branch-start';
				}
			}
		},

		topLimitClass(): string {
			let orientation = this.noodel.options.orientation;
			let branchDirection = this.noodel.options.branchDirection;

			if (orientation === "ttb") {
				return 'nd-limit-trunk-start';
			}
			else if (orientation === "btt") {
				return 'nd-limit-trunk-end';
			}
			else {
				if (branchDirection === "normal") {
					return 'nd-limit-branch-start';
				}
				else {
					return 'nd-limit-branch-end';
				}
			}
		},

		bottomLimitClass(): string {
			let orientation = this.noodel.options.orientation;
			let branchDirection = this.noodel.options.branchDirection;

			if (orientation === "ttb") {
				return 'nd-limit-trunk-end';
			}
			else if (orientation === "btt") {
				return 'nd-limit-trunk-start';
			}
			else {
				if (branchDirection === "normal") {
					return 'nd-limit-branch-end';
				}
				else {
					return 'nd-limit-branch-start';
				}
			}
		},

		trunkStyle(): {} {
			let orientation = this.noodel.options.orientation;
			let trunkOffset = getActualOffsetTrunk(this.noodel);
			let transform: string = null;

			if (orientation === "ltr") {
				transform = `translateX(${trunkOffset}px)`;
			}
			else if (orientation === "rtl") {
				transform = `translateX(${-trunkOffset}px)`;
			}
			else if (orientation === "ttb") {
				transform = `translateY(${trunkOffset}px)`;
			}
			else if (orientation === "btt") {
				transform = `translateY(${-trunkOffset}px)`;
			}

			return { transform };
		},

		trunkClass(): string {
			if (this.noodel.applyTrunkMove && this.noodel.isMounted) {
				return "nd-trunk-move";
			}
		},

		allBranchParents(): NodeState[] {
			let allBranchParents: NodeState[] = [];

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
		}
	},

	methods: {
		onDragStart(ev: DragEvent) {
			if (this.noodel.isInInspectMode) return;
			ev.preventDefault();
		}
	},
});
</script>
