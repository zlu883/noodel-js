<!--------------------------- TEMPLATE ----------------------------->

<template>
	<div
		class="nd-branch-backdrop"
		:class="branchBackdropClass"
		:style="branchBackdropStyle"
	/>
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">
import NdNoode from "./NdNoode.vue";
import NoodelState from "../types/NoodelState";
import NoodeState from "../types/NoodeState";
import { PropType, defineComponent } from "vue";

// By extracting the transition-group into its own component addresses the issue
// of enter/leave transitions not occuring properly as per https://github.com/vuejs/vue/issues/6946
export default defineComponent({
	components: {
		NdNoode,
	},

	props: {
		parent: Object as PropType<NoodeState>,
		noodel: Object as PropType<NoodelState>,
	},

	mounted: function() {
		this.parent.r.branchBackdropEl = this.$el;
	},

	unmounted: function() {
		this.parent.r.branchBackdropEl = null;
	},

	computed: {
		branchBackdropClass(): any[] {
			return [
				{
					"nd-branch-backdrop-focal": this.parent.isFocalParent,
				},
				...this.parent.classNames.branchBackdrop
			];
		},

		branchBackdropStyle(): {} {
			let orientation = this.noodel.options.orientation;
			let style = this.parent.styles.branchBackdrop;

			if (orientation === "ltr") {
				style["left"] = `${this.parent.trunkRelativeOffset}px`;
				style["width"] = `${this.parent.branchSize}px`;
			} 
			else if (orientation === "rtl") {
				style["right"] = `${this.parent.trunkRelativeOffset}px`;
				style["width"] = `${this.parent.branchSize}px`;
			} 
			else if (orientation === "ttb") {
				style["top"] = `${this.parent.trunkRelativeOffset}px`;
				style["height"] = `${this.parent.branchSize}px`;
			} 
			else if (orientation === "btt") {
				style["bottom"] = `${this.parent.trunkRelativeOffset}px`;
				style["height"] = `${this.parent.branchSize}px`;
			}

			return style;
		},
	}
});
</script>
