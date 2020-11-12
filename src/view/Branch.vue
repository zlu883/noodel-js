<!--------------------------- TEMPLATE ----------------------------->

<template>
	<transition name="nd-branch">
		<div
			v-show="parent.isBranchVisible || parent.isBranchTransparent"
			class="nd-branch"
			:class="branchClass"
			:style="branchStyle"
			@transitionend="onTransitionEnd"	
		>
			<NodeTransitionGroup 
				:noodel="noodel" 
				:parent="parent" 
			/>
		</div>
	</transition>
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">
import NodeTransitionGroup from "./NodeTransitionGroup.vue";
import { getFocalHeight, getFocalWidth } from "../controllers/getters";
import NodeState from "../types/NodeState";
import NoodelState from "../types/NoodelState";
import { PropType, defineComponent } from "vue";
import { updateBranchSize } from "../controllers/noodel-align";
import {
	attachBranchResizeSensor,
	detachBranchResizeSensor,
} from "../controllers/resize-detect";

export default defineComponent({
	components: {
		NodeTransitionGroup,
	},

	props: {
		parent: Object as PropType<NodeState>,
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
		branchStyle(): string {
			let orientation = this.noodel.options.orientation;
			let branchDirection = this.noodel.options.branchDirection;
			let style = '';

			if (orientation === "ltr") {
				style += `left: ${this.parent.trunkRelativeOffset}px;`;
			}
			else if (orientation === "rtl") {
				style += `right: ${this.parent.trunkRelativeOffset}px;`;
			}
			else if (orientation === "ttb") {
				style += `top: ${this.parent.trunkRelativeOffset}px;`;
			}
			else if (orientation === "btt") {
				style += `bottom: ${this.parent.trunkRelativeOffset}px;`;
			}

			if (orientation === "ltr" || orientation === "rtl") {
				if (branchDirection === "normal") {
					style += `transform: translateY(${-this.parent.branchOffset + getFocalHeight(this.noodel)}px);`;
				}
				else if (branchDirection === "reverse") {
					style += `transform: translateY(${this.parent.branchOffset - getFocalHeight(this.noodel)}px);`;
				}
			} else if (orientation === "ttb" || orientation === "btt") {
				if (branchDirection === "normal") {
					style += `transform: translateX(${-this.parent.branchOffset + getFocalWidth(this.noodel)}px);`;
				}
				else if (branchDirection === "reverse") {
					style += `transform: translateX(${this.parent.branchOffset - getFocalWidth(this.noodel)}px);`;
				}
			}

			if (!this.parent.isBranchVisible) {
				style += 'pointer-events: none;';

				if (this.parent.isBranchTransparent) {
					style += 'opacity: 0;';
				}
			}

			style += this.parent.styles.branch || '';

			return style;
		},

		branchClass(): string {
			let className = '';

			if (this.parent.applyBranchMove) className += 'nd-branch-move ';
			if (this.parent.isFocalParent) className += 'nd-branch-focal ';

			className += this.parent.classNames.branch || '';

			return className;
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