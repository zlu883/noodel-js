<!--------------------------- TEMPLATE ----------------------------->

<template>
	<div 
		class="nd-node nd-node-move" 
		:class="nodeClass"
		:style="nodeStyle"
		@pointerup="onPointerUp"
		@mouseup="onPointerUp"
		@touchend="onPointerUp"
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
	</div>
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">
import NodeState from "../types/NodeState";
import { updateNodeSize } from "../controllers/alignment";
import NoodelState from "../types/NoodelState";
import { traverseAncestors } from "../controllers/traverse";
import { nextTick, PropType, defineComponent } from "vue";
import { getBranchDirection, getOrientation, isBranchVisible } from '../controllers/getters';

export default defineComponent({
	props: {
		node: Object as PropType<NodeState>,
		noodel: Object as PropType<NoodelState>,
	},

	mounted() {
		this.node.r.el = this.$el as HTMLDivElement;

		// do initial size capture
		let nodeRect = this.node.r.el.getBoundingClientRect();

		updateNodeSize(
			this.noodel,
			this.node,
			nodeRect.height,
			nodeRect.width
		);
	},

	unmounted() {
		this.node.branchRelativeOffset = 0;
		this.node.trunkRelativeOffset = 0;
        this.node.size = 0;
        this.node.r.el = null;
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

			if (isBranchVisible(this.noodel, this.node)) className += 'nd-child-indicator-expanded ';

			className += this.node.classNames.childIndicator || '';

			return className;
		},

		childIndicatorStyle(): {} {
			return this.node.styles.childIndicator;
		},
	},
});
</script>
