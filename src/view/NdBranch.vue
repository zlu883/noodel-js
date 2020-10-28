<!--------------------------- TEMPLATE ----------------------------->

<template>
	<div
		class="nd-branch"
		:class="branchClass"
		:style="branchStyle"
		@transitionend="onTransitionEnd"
	>
		<NdBranchInner 
			:noodel="noodel" 
			:parent="parent" 
		/>
	</div>
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">
import NdBranchInner from "./NdBranchInner.vue";
import { getFocalHeight, getFocalWidth } from "../controllers/getters";
import NoodeState from "../types/NoodeState";
import NoodelState from "../types/NoodelState";
import { PropType, defineComponent } from "vue";
import { updateBranchSize } from "../controllers/noodel-align";
import {
	attachBranchResizeSensor,
	detachBranchResizeSensor,
} from "../controllers/resize-detect";

export default defineComponent({
	components: {
		NdBranchInner,
	},

	props: {
		parent: Object as PropType<NoodeState>,
		noodel: Object as PropType<NoodelState>,
	},

	mounted() {
		this.parent.r.branchEl = this.$el as HTMLDivElement;

		let branchRect = this.parent.r.branchEl.getBoundingClientRect();

		updateBranchSize(
			this.noodel,
			this.parent,
			branchRect.height,
			branchRect.width,
			true
		);
		attachBranchResizeSensor(this.noodel, this.parent);
	},

	beforeUnmount() {
		detachBranchResizeSensor(this.parent);
		this.parent.r.branchEl = null;
	},

	computed: {
		branchStyle(): {} {
			let orientation = this.noodel.options.orientation;
			let branchDirection = this.noodel.options.branchDirection;
			let style = this.parent.styles.branch;

			if (orientation === "ltr") {
				style["left"] = `${this.parent.trunkRelativeOffset}px`;
			} 
			else if (orientation === "rtl") {
				style["right"] = `${this.parent.trunkRelativeOffset}px`;
			} 
			else if (orientation === "ttb") {
				style["top"] = `${this.parent.trunkRelativeOffset}px`;
			} 
			else if (orientation === "btt") {
				style["bottom"] = `${this.parent.trunkRelativeOffset}px`;
			}

			if (orientation === "ltr" || orientation === "rtl") {
				if (branchDirection === "normal") {
					style["transform"] = `translateY(${-this.parent.branchOffset + getFocalHeight(this.noodel)}px)`;
				} 
				else if (branchDirection === "reverse") {
					style["transform"] = `translateY(${ this.parent.branchOffset - getFocalHeight(this.noodel)}px)`;
				}
			} else if (orientation === "ttb" || orientation === "btt") {
				if (branchDirection === "normal") {
					style["transform"] = `translateX(${-this.parent.branchOffset + getFocalWidth(this.noodel)}px)`;
				} 
				else if (branchDirection === "reverse") {
					style["transform"] = `translateX(${this.parent.branchOffset - getFocalWidth(this.noodel)}px)`;
				}
			}

			if (!this.parent.isBranchVisible) {
				style["pointer-events"] = "none";

				if (this.parent.isBranchTransparent) {
					style["opacity"] = 0;
				}
			}

			return style;
		},

		branchClass(): any[] {
			return [
				{
					"nd-branch-move": this.parent.applyBranchMove,
					"nd-branch-focal": this.parent.isFocalParent,
				},
				...this.parent.classNames.branch
			];
		},
	},

	methods: {
		onTransitionEnd(ev: TransitionEvent) {
			if (
				ev.propertyName === "transform" &&
				ev.target === this.parent.r.branchEl
			) {
				if (this.parent.r.ignoreTransitionEnd) return;
				this.parent.applyBranchMove = false;
			}
		},
	},
});
</script>