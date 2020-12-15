<!--------------------------- TEMPLATE ----------------------------->

<template>
	<div
		v-show="showBranch"
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
import { getActualOffsetBranch, getBranchDirection, getOrientation, isBranchVisible } from '../controllers/getters';

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
			branchRect.width
		);

		// need double RAF here otherwise the sliders will animate on mount
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				this.parent.isBranchMounted = true;
				this.parent.forceVisible = false;
			});
		});
	},

	unmounted() {
		this.parent.r.branchEl = null;
		this.parent.r.branchSliderEl = null;
		this.parent.isBranchMounted = false;
		this.parent.applyBranchMove = false;
		this.parent.forceVisible = true;
		this.parent.branchSize = 0;
	},

	computed: {
		showBranch(): boolean {
			return isBranchVisible(this.noodel, this.parent) || this.parent.forceVisible;
		},

		branchClass(): string {
			let className = `nd-branch-level-${this.parent.level + 1} `;

			if (this.parent.isFocalParent) className += 'nd-branch-focal ';

			className += this.parent.classNames.branch || '';

			return className;
		},

		branchStyle(): string {
			let orientation = getOrientation(this.noodel);
			let branchDirection = getBranchDirection(this.noodel);
			let style = '';

			if (orientation === "ltr") {
				style += `left: 0;`;
				style += `transform: translateX(${this.parent.trunkRelativeOffset}px);`
			}
			else if (orientation === "rtl") {
				style += `right: 0;`;
				style += `transform: translateX(${-this.parent.trunkRelativeOffset}px);`
			}
			else if (orientation === "ttb") {
				style += `top: 0;`;
				style += `transform: translateY(${this.parent.trunkRelativeOffset}px);`
			}
			else if (orientation === "btt") {
				style += `bottom: 0;`;
				style += `transform: translateY(${-this.parent.trunkRelativeOffset}px);`
			}

			if (!isBranchVisible(this.noodel, this.parent)) {
				style += 'pointer-events: none;';

				if (this.parent.forceVisible) {
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
			let orientation = getOrientation(this.noodel);
			let branchDirection = getBranchDirection(this.noodel);
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