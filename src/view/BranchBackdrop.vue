<!--------------------------- TEMPLATE ----------------------------->

<template>
	<transition name="nd-branch-backdrop">
		<div
			v-show="parent.isBranchVisible"
			class="nd-branch-backdrop"
			:class="branchBackdropClass"
			:style="branchBackdropStyle"
		/>
	</transition>
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">
import NoodelState from "../types/NoodelState";
import NodeState from "../types/NodeState";
import { PropType, defineComponent } from "vue";

export default defineComponent({
	props: {
		parent: Object as PropType<NodeState>,
		noodel: Object as PropType<NoodelState>,
	},

	mounted: function () {
		this.parent.r.branchBackdropEl = this.$el;
	},

	unmounted: function () {
		this.parent.r.branchBackdropEl = null;
	},

	computed: {
		branchBackdropClass(): string {
			let className = '';

			if (this.parent.isFocalParent) className += 'nd-branch-backdrop-focal ';

			className += this.parent.classNames.branchBackdrop || '';

			return className;
		},

		branchBackdropStyle(): {} {
			let orientation = this.noodel.options.orientation;
			let style = '';

			if (orientation === "ltr") {
				style += `left: ${this.parent.trunkRelativeOffset}px;`;
				style += `width: ${this.parent.branchSize}px;`;
			}
			else if (orientation === "rtl") {
				style += `right: ${this.parent.trunkRelativeOffset}px;`;
				style += `width: ${this.parent.branchSize}px;`;
			}
			else if (orientation === "ttb") {
				style += `top: ${this.parent.trunkRelativeOffset}px;`;
				style += `height: ${this.parent.branchSize}px;`;
			}
			else if (orientation === "btt") {
				style += `bottom: ${this.parent.trunkRelativeOffset}px;`;
				style += `height: ${this.parent.branchSize}px;`;
			}

			style += this.parent.styles.branchBackdrop || '';

			return style;
		},
	}
});
</script>
