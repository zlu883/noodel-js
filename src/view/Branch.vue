<!--------------------------- TEMPLATE ----------------------------->

<template>
	<div
		v-show="parent.isBranchVisible || parent.isBranchTransparent"
		class="nd-branch"
		:class="branchClass"
		:style="branchStyle"
	>
		<div
			class="nd-branch-slider"
			ref="slider"	
			:class="branchSliderClass"
			:style="branchSliderStyle"		
			@transitionend="onTransitionEnd"	
		>
			<NodeTransitionGroup 
				:noodel="noodel" 
				:parent="parent" 
			/>
		</div>
	</div>
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">
import NodeTransitionGroup from "./NodeTransitionGroup.vue";
import { getFocalHeight, getFocalWidth } from "../controllers/getters";
import NodeState from "../types/NodeState";
import NoodelState from "../types/NoodelState";
import { PropType, defineComponent, nextTick } from "vue";
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
		this.parent.r.branchEl = this.$el;
		this.parent.r.branchSliderEl = this.$refs.slider as HTMLDivElement;

		let branchRect = this.parent.r.branchSliderEl.getBoundingClientRect();

		updateBranchSize(
			this.noodel,
			this.parent,
			branchRect.height,
			branchRect.width,
			true
		);
		attachBranchResizeSensor(this.noodel, this.parent);

		nextTick(() => {
			this.parent.isBranchMounted = true;
		});
	},

	beforeUnmount() {
		detachBranchResizeSensor(this.parent);
	},

	unmounted() {
		this.parent.r.branchEl = null;
		this.parent.r.branchSliderEl = null;
		this.parent.isBranchMounted = false;
		this.parent.applyBranchMove = false;
		this.parent.isBranchTransparent = true;
		this.parent.branchSize = 0;
		this.parent.branchOffset = 0;
	},

	computed: {
		branchClass(): string {
			let className = '';

			if (this.parent.isFocalParent) className += 'nd-branch-focal ';

			className += this.parent.classNames.branch || '';

			return className;
		},

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

			if (!this.parent.isBranchVisible) {
				style += 'pointer-events: none;';

				if (this.parent.isBranchTransparent) {
					style += 'opacity: 0;';
				}
			}

			style += this.parent.styles.branch || '';

			return style;
		},

		branchSliderClass(): string {
			let className = '';

			if (this.parent.applyBranchMove) className += 'nd-branch-slider-move ';

			className += this.parent.classNames.branchSlider || '';

			return className;
		},

		branchSliderStyle(): string {
			let orientation = this.noodel.options.orientation;
			let branchDirection = this.noodel.options.branchDirection;
			let style = '';

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

			style += this.parent.styles.branchSlider || '';

			return style;
		},
	},

	methods: {
		onTransitionEnd(ev: TransitionEvent) {
			if (
				ev.propertyName === "transform" &&
				ev.target === this.parent.r.branchSliderEl
			) {
				if (this.parent.r.ignoreTransitionEnd) return;
				this.parent.applyBranchMove = false;
			}
		},
	},
});
</script>