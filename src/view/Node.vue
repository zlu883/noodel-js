<!--------------------------- TEMPLATE ----------------------------->

<template>
	<div 
		class="nd-node" 
		:class="nodeClass"
		:style="nodeStyle"
	>
		<transition name="nd-inspect-backdrop">
			<div
				v-if="node.isInInspectMode"
				class="nd-inspect-backdrop"
			></div>
		</transition>
		<div
			ref="contentBox"
			class="nd-content-box"
			:class="contentBoxClass"
			:style="contentBoxStyle"
			v-bind.prop="typeof node.content === 'string' ? { innerHTML: node.content } : null"
			@pointerup="onPointerUp"
			@mouseup="onPointerUp"
			@touchend="onPointerUp"
		>
			<component
				v-if="node.content && typeof node.content === 'object'"
				:is="node.content.component"
				v-bind="node.content.props"
				v-on="node.content.eventListeners"
			/>
		</div>
		<transition name="nd-child-indicator">
			<div
				v-if="showChildIndicator"
				class="nd-child-indicator"
				:class="childIndicatorClass"
				:style="childIndicatorStyle"
			/>
		</transition>
		<transition name="nd-overflow-indicator">
			<div
				v-if="showOverflowIndicators && node.hasOverflowTop && !node.isInInspectMode"
				class="nd-overflow-indicator nd-overflow-indicator-top"
				:class="overflowIndicatorTopClass"
				:style="overflowIndicatorTopStyle"
			/>
		</transition>
		<transition name="nd-overflow-indicator">
			<div
				v-if="showOverflowIndicators && node.hasOverflowLeft && !node.isInInspectMode"
				class="nd-overflow-indicator nd-overflow-indicator-left"
				:class="overflowIndicatorLeftClass"
				:style="overflowIndicatorLeftStyle"
			/>
		</transition>
		<transition name="nd-overflow-indicator">
			<div
				v-if="showOverflowIndicators && node.hasOverflowBottom && !node.isInInspectMode"
				class="nd-overflow-indicator nd-overflow-indicator-bottom"
				:class="overflowIndicatorBottomClass"
				:style="overflowIndicatorBottomStyle"
			/>
		</transition>
		<transition name="nd-overflow-indicator">
			<div
				v-if="showOverflowIndicators && node.hasOverflowRight && !node.isInInspectMode"
				class="nd-overflow-indicator nd-overflow-indicator-right"
				:class="overflowIndicatorRightClass"
				:style="overflowIndicatorRightStyle"
			/>
		</transition>
	</div>
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">
import NodeState from "../types/NodeState";
import {
	checkContentOverflow,
	updateNodeSize,
} from "../controllers/noodel-align";
import NoodelState from "../types/NoodelState";
import { traverseAncestors } from "../controllers/noodel-traverse";
import { getPath, getFocalHeight, getFocalWidth } from "../controllers/getters";
import { nextTick, PropType, defineComponent } from "vue";
import {
	attachResizeSensor,
	detachResizeSensor,
} from "../controllers/resize-detect";

export default defineComponent({
	props: {
		node: Object as PropType<NodeState>,
		noodel: Object as PropType<NoodelState>,
	},

	mounted() {
		this.node.r.el = this.$el as HTMLDivElement;
		this.node.r.contentBoxEl = this.$refs.contentBox as HTMLDivElement;

		// do initial size capture
		let nodeRect = this.node.r.el.getBoundingClientRect();

		updateNodeSize(
			this.noodel,
			this.node,
			nodeRect.height,
			nodeRect.width,
			true
		);
		checkContentOverflow(this.noodel, this.node);

		attachResizeSensor(this.noodel, this.node);

		// allows parent branch to fall back to display: none after first size update,
		// using nextTick to wait for parent branch size capture to finish first
		nextTick(() => {
			this.node.parent.isBranchTransparent = false;
		});
	},

	beforeUnmount() {
		detachResizeSensor(this.node);

		// check fade flag and adjust absolute positioning as necessary
		if (this.node.r.fade) {
			this.node.r.fade = false;
			let orientation = this.noodel.options.orientation;
			let branchDirection = this.noodel.options.branchDirection;
			let offset = this.node.branchRelativeOffset + "px";

			this.node.r.el.classList.remove("nd-node-active");

			if (orientation === "ltr" || orientation === "rtl") {
				this.node.r.el.style.width = "100%";

				if (branchDirection === "normal") {
					this.node.r.el.style.top = offset;
				} else {
					this.node.r.el.style.bottom = offset;
				}
			} else {
				this.node.r.el.style.height = "100%";

				if (branchDirection === "normal") {
					this.node.r.el.style.left = offset;
				} else {
					this.node.r.el.style.right = offset;
				}
			}
		}

		this.node.r.contentBoxEl = null;
		this.node.r.el = null;
	},

	unmounted() {
		this.node.branchRelativeOffset = 0;
		this.node.trunkRelativeOffset = 0;
		this.node.size = 0;
		this.node.r.el = null;
		this.node.r.contentBoxEl = null;
	},

	methods: {
		onPointerUp() {
			if (this.noodel.r.pointerUpSrcNode) return;
			this.noodel.r.pointerUpSrcNode = this.node;
			requestAnimationFrame(
				() => (this.noodel.r.pointerUpSrcNode = null)
			);
		},
	},

	computed: {
		nodeClass(): string {
			let className = '';

			if (this.node.isActive) className += 'nd-node-active ';
			if (this.node.isInInspectMode) className += 'nd-node-inspect ';

			className += this.node.classNames.node || '';

			return className;
		},

		nodeStyle(): string {
			return this.node.styles.node;
		},

		contentBoxClass(): string {
			return this.node.classNames.contentBox;
		},

		contentBoxStyle(): string {
			return this.node.styles.contentBox;
		},

		showChildIndicator(): boolean {
			let showOption =
				typeof this.node.options.showChildIndicator === "boolean"
					? this.node.options.showChildIndicator
					: this.noodel.options.showChildIndicators;

			return showOption && this.node.children.length > 0;
		},

		childIndicatorClass(): string {
			let className = '';

			if (this.node.isBranchVisible) className += 'nd-child-indicator-expanded ';

			className += this.node.classNames.childIndicator || '';

			return className;
		},

		childIndicatorStyle(): {} {
			return this.node.styles.childIndicator;
		},

		showOverflowIndicators(): boolean {
			return typeof this.node.options.showOverflowIndicators === "boolean"
				? this.node.options.showOverflowIndicators
				: this.noodel.options.showOverflowIndicators;
		},

		overflowIndicatorLeftClass(): string {
			return this.node.classNames.overflowIndicatorLeft;
		},

		overflowIndicatorLeftStyle(): string {
			return this.node.styles.overflowIndicatorLeft;
		},

		overflowIndicatorRightClass(): string {
			return this.node.classNames.overflowIndicatorRight;
		},

		overflowIndicatorRightStyle(): string {
			return this.node.styles.overflowIndicatorRight;
		},

		overflowIndicatorTopClass(): string {
			return this.node.classNames.overflowIndicatorTop;
		},

		overflowIndicatorTopStyle(): string {
			return this.node.styles.overflowIndicatorTop;
		},

		overflowIndicatorBottomClass(): string {
			return this.node.classNames.overflowIndicatorBottom;
		},

		overflowIndicatorBottomStyle(): string {
			return this.node.styles.overflowIndicatorBottom;
		}
	},
});
</script>
