<!--------------------------- TEMPLATE ----------------------------->

<template>
	<transition
		name="nd-node"
		:appear="noodel.isMounted"
		@afterLeave="afterLeave"
	>
		<div 
			v-show="!node.d"
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
		</div>
	</transition>
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">
import NodeState from "../types/NodeState";
import { updateNodeSize } from "../controllers/alignment";
import NoodelState from "../types/NoodelState";
import { traverseAncestors } from "../controllers/traverse";
import { nextTick, PropType, defineComponent } from "vue";
import { getBranchDirection, getOrientation, isBranchVisible } from '../controllers/getters';
import { queueCleanupExitedNodes } from "../controllers/transition";

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
		);

		// allows parent branch to fall back to display: none after first size update,
		// using nextTick to wait for parent branch size capture to finish first
		nextTick(() => {
			this.node.parent.isBranchTransparent = false;
		});
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
			if (this.node.d) return;
			if (this.noodel.r.pointerUpSrcNode) return;
			this.noodel.r.pointerUpSrcNode = this.node;
			requestAnimationFrame(
				() => (this.noodel.r.pointerUpSrcNode = null)
			);
		},

		afterLeave() {
			this.node.e = true;
			queueCleanupExitedNodes(this.node.parent);
		}
	},

	computed: {
		nodeClass(): string {
			let className = '';

			if (this.node.isActive) className += 'nd-node-active ';

			className += this.node.classNames.node || '';

			return className;
		},

		nodeStyle(): string {
			let style = '';

			if (this.node.d) {
				let orientation = getOrientation(this.noodel);
				let branchDirection = getBranchDirection(this.noodel);
				let offset = this.node.branchRelativeOffset + "px";
				let el = this.node.r.el;

				style += "position: absolute; "

				if (orientation === "ltr" || orientation === "rtl") {
					if (branchDirection === "normal") {
						style += `top: ${offset}; `;
					} else {
						style += `bottom: ${offset}; `;
					}
				} else {
					if (branchDirection === "normal") {
						style += `left: ${offset}; `;
					} else {
						style += `right: ${offset}; `;
					}
				}
			}
		
			style += this.node.styles.node;
			
			return style;
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
