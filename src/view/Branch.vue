<!--------------------------- TEMPLATE ----------------------------->

<template>
	<div
		v-show="parent.isBranchVisible || parent.isBranchTransparent"
		class="nd-branch"
		:class="branchClass"
		:style="branchStyle"
	>
		<div
			v-if="parent.branchContent"
			class="nd-branch-content-box"
			:class="branchContentBoxClass"
			:style="branchContentBoxStyle"
			v-bind.prop="typeof parent.branchContent === 'string' ? { innerHTML: parent.branchContent } : null"			
		>
			<component
				v-if="typeof parent.branchContent === 'object'"
				:is="parent.branchContent.component"
				v-bind="parent.branchContent.props"
				v-on="parent.branchContent.eventListeners"
			/>
		</div>
		<div
			class="nd-branch-slider"
			ref="slider"	
			:class="branchSliderClass"
			:style="branchSliderStyle"		
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
import NodeState from "../types/NodeState";
import NoodelState from "../types/NoodelState";
import { PropType, defineComponent, nextTick } from "vue";
import { updateBranchSize } from "../controllers/alignment";
import {
	attachBranchResizeSensor,
	detachBranchResizeSensor,
} from "../controllers/resize-sensor";
import { getActualOffsetBranch } from '../controllers/getters';

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

		requestAnimationFrame(() => {
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

			if (this.parent.applyBranchMove && this.parent.isBranchMounted) {
				className += 'nd-branch-slider-move ';
			}

			className += this.parent.classNames.branchSlider || '';

			return className;
		},

		branchSliderStyle(): string {
			let orientation = this.noodel.options.orientation;
			let branchDirection = this.noodel.options.branchDirection;
			let branchOffset = getActualOffsetBranch(this.noodel, this.parent);
			let style = '';

			if (orientation === "ltr" || orientation === "rtl") {
				if (branchDirection === "normal") {
					style += `transform: translateY(${branchOffset}px);`;
				}
				else if (branchDirection === "reverse") {
					style += `transform: translateY(${-branchOffset}px);`;
				}
			} else if (orientation === "ttb" || orientation === "btt") {
				if (branchDirection === "normal") {
					style += `transform: translateX(${branchOffset}px);`;
				}
				else if (branchDirection === "reverse") {
					style += `transform: translateX(${-branchOffset}px);`;
				}
			}

			style += this.parent.styles.branchSlider || '';

			return style;
		},

		branchContentBoxClass(): string {
			return this.parent.classNames.branchContentBox;
		},

		branchContentBoxStyle(): string {
			return this.parent.styles.branchContentBox;
		},
	}
});
</script>