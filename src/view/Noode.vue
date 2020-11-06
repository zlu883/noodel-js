<!--------------------------- TEMPLATE ----------------------------->

<template>
	<div 
		class="nd-noode" 
		:class="noodeClass"
		:style="noodeStyle"
	>
		<transition name="nd-inspect-backdrop">
			<div
				v-if="noode.isInInspectMode"
				class="nd-inspect-backdrop"
			></div>
		</transition>
		<div
			ref="contentBox"
			class="nd-content-box"
			:class="contentBoxClass"
			:style="contentBoxStyle"
			v-bind.prop="typeof noode.content === 'string' ? { innerHTML: noode.content } : null"
			@pointerup="onPointerUp"
			@mouseup="onPointerUp"
			@touchend="onPointerUp"
		>
			<component
				v-if="noode.content && typeof noode.content === 'object'"
				:is="noode.content.component"
				v-bind="noode.content.props"
				v-on="noode.content.eventListeners"
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
				v-if="showOverflowIndicators && noode.hasOverflowTop"
				class="nd-overflow-indicator nd-overflow-indicator-top"
				:class="overflowIndicatorTopClass"
				:style="overflowIndicatorTopStyle"
			/>
		</transition>
		<transition name="nd-overflow-indicator">
			<div
				v-if="showOverflowIndicators && noode.hasOverflowLeft"
				class="nd-overflow-indicator nd-overflow-indicator-left"
				:class="overflowIndicatorLeftClass"
				:style="overflowIndicatorLeftStyle"
			/>
		</transition>
		<transition name="nd-overflow-indicator">
			<div
				v-if="showOverflowIndicators && noode.hasOverflowBottom"
				class="nd-overflow-indicator nd-overflow-indicator-bottom"
				:class="overflowIndicatorBottomClass"
				:style="overflowIndicatorBottomStyle"
			/>
		</transition>
		<transition name="nd-overflow-indicator">
			<div
				v-if="showOverflowIndicators && noode.hasOverflowRight"
				class="nd-overflow-indicator nd-overflow-indicator-right"
				:class="overflowIndicatorRightClass"
				:style="overflowIndicatorRightStyle"
			/>
		</transition>
	</div>
</template>

<!---------------------------- SCRIPT ------------------------------>

<script lang="ts">
import NoodeState from "../types/NoodeState";
import {
	checkContentOverflow,
	updateNoodeSize,
} from "../controllers/noodel-align";
import NoodelState from "../types/NoodelState";
import { traverseAncestors } from "../controllers/noodel-traverse";
import { getPath, getFocalHeight, getFocalWidth } from "../controllers/getters";
import { nextTick, PropType, defineComponent } from "vue";
import Noode from "../main/Noode";
import {
	attachResizeSensor,
	detachResizeSensor,
} from "../controllers/resize-detect";

export default defineComponent({
	props: {
		noode: Object as PropType<NoodeState>,
		noodel: Object as PropType<NoodelState>,
	},

	mounted() {
		this.noode.r.el = this.$el as HTMLDivElement;
		this.noode.r.contentBoxEl = this.$refs.contentBox as HTMLDivElement;

		// nextTick is required for vue's v-move effect to work
		nextTick(() => {
			// do initial size capture
			let noodeRect = this.noode.r.el.getBoundingClientRect();

			updateNoodeSize(
				this.noodel,
				this.noode,
				noodeRect.height,
				noodeRect.width,
				true
			);
			checkContentOverflow(this.noodel, this.noode);

			attachResizeSensor(this.noodel, this.noode);

			// allows parent branch to fall back to display: none after first size update,
			// using nextTick to wait for parent branch size capture to finish first
			nextTick(() => {
				this.noode.parent.isBranchTransparent = false;
			});
		});
	},

	beforeUnmount() {
		detachResizeSensor(this.noode);

		// check fade flag and adjust absolute positioning as necessary
		if (this.noode.r.fade) {
			this.noode.r.fade = false;
			let orientation = this.noodel.options.orientation;
			let branchDirection = this.noodel.options.branchDirection;
			let offset = this.noode.branchRelativeOffset + "px";

			this.noode.r.el.classList.remove("nd-noode-active");

			if (orientation === "ltr" || orientation === "rtl") {
				this.noode.r.el.style.width = "100%";

				if (branchDirection === "normal") {
					this.noode.r.el.style.top = offset;
				} else {
					this.noode.r.el.style.bottom = offset;
				}
			} else {
				this.noode.r.el.style.height = "100%";

				if (branchDirection === "normal") {
					this.noode.r.el.style.left = offset;
				} else {
					this.noode.r.el.style.right = offset;
				}
			}
		}

		this.noode.r.contentBoxEl = null;
		this.noode.r.el = null;
	},

	methods: {
		onPointerUp() {
			if (this.noodel.r.pointerUpSrcNoode) return;
			this.noodel.r.pointerUpSrcNoode = this.noode;
			requestAnimationFrame(
				() => (this.noodel.r.pointerUpSrcNoode = null)
			);
		},
	},

	computed: {
		noodeClass(): string {
			let className = '';

			if (this.noode.isActive) className += 'nd-noode-active ';
			if (this.noode.isInInspectMode) className += 'nd-noode-inspect ';

			className += this.noode.classNames.noode || '';

			return className;
		},

		noodeStyle(): string {
			return this.noode.styles.noode;
		},

		contentBoxClass(): string {
			return this.noode.classNames.contentBox;
		},

		contentBoxStyle(): string {
			return this.noode.styles.contentBox;
		},

		showChildIndicator(): boolean {
			let showOption =
				typeof this.noode.options.showChildIndicator === "boolean"
					? this.noode.options.showChildIndicator
					: this.noodel.options.showChildIndicators;

			return showOption && this.noode.children.length > 0;
		},

		childIndicatorClass(): string {
			let className = '';

			if (this.noode.isBranchVisible) className += 'nd-child-indicator-expanded ';

			className += this.noode.classNames.childIndicator || '';

			return className;
		},

		childIndicatorStyle(): {} {
			return this.noode.styles.childIndicator;
		},

		showOverflowIndicators(): boolean {
			return typeof this.noode.options.showOverflowIndicators === "boolean"
				? this.noode.options.showOverflowIndicators
				: this.noodel.options.showOverflowIndicators;
		},

		overflowIndicatorLeftClass(): string {
			return this.noode.classNames.overflowIndicatorLeft;
		},

		overflowIndicatorLeftStyle(): string {
			return this.noode.styles.overflowIndicatorLeft;
		},

		overflowIndicatorRightClass(): string {
			return this.noode.classNames.overflowIndicatorRight;
		},

		overflowIndicatorRightStyle(): string {
			return this.noode.styles.overflowIndicatorRight;
		},

		overflowIndicatorTopClass(): string {
			return this.noode.classNames.overflowIndicatorTop;
		},

		overflowIndicatorTopStyle(): string {
			return this.noode.styles.overflowIndicatorTop;
		},

		overflowIndicatorBottomClass(): string {
			return this.noode.classNames.overflowIndicatorBottom;
		},

		overflowIndicatorBottomStyle(): string {
			return this.noode.styles.overflowIndicatorBottom;
		}
	},
});
</script>
