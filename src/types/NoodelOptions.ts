import { BranchDirection } from './BranchDirection';
import { Orientation } from './Orientation';

/**
 * Global options for a noodel.
 */
export default interface NoodelOptions {
    /**
     * The number of levels of descendant branches to show
     * after the current focal branch. Defaults to 1.
     */
    visibleSubtreeDepth?: number;
    /**
     * If true, will keep the current branch depth (if possible) when
     * tapping on the sibling of an ancestor. Can be used to create an effect
     * resembling conventional navigation menus. Defaults to false.
     */
    retainDepthOnTapNavigation?: boolean;
    /**
     * Whether to apply the default keyboard navigation. Defaults to true.
     */
    useKeyNavigation?: boolean;
    /**
     * Whether to apply the default wheel navigation. Defaults to true.
     */
    useWheelNavigation?: boolean;
    /**
     * Whether to apply the default swipe navigation. Defaults to true.
     */
    useSwipeNavigation?: boolean;
    /**
     * Whether to apply the default tap navigation. Defaults to true.
     */
    useTapNavigation?: boolean;
    /**
     * Whether to allow toggling inspect mode via the Enter key. Defaults to true.
     */
    useInspectModeKey?: boolean;
    /**
     * Whether to allow toggling inspect mode via the double tap. Defaults to true.
     */
    useInspectModeDoubleTap?: boolean;
    /**
     * Determines whether routing should be enabled for this noodel. Defaults to true.
     */
    useRouting?: boolean;
    /**
     * Number of pixels to move for every pixel swiped in the branch axis. Defaults to 1.
     */
    swipeMultiplierBranch?: number;
    /**
     * Number of pixels to move for every pixel swiped in the trunk axis. Defaults to 1.
     */
    swipeMultiplierTrunk?: number;
    /**
     * Number of nodes (per unit of velocity) to snap across after a swipe is released.
     * Defaults to 1.
     */
    snapMultiplierBranch?: number;
    /**
     * Number of levels (per unit of velocity) to snap across after a swipe is released.
     * Defaults to 1.
     */
    snapMultiplierTrunk?: number;
    /**
     * Whether to render the limit indicators of the canvas. Defaults to true.
     */
    showLimitIndicators?: boolean;
    /**
     * Whether to render the child indicators of nodes. Defaults to true.
     */
    showChildIndicators?: boolean;
    /**
     * Determines the direction of the trunk axis. Defaults to "ltr" (left to right).
     */
    orientation?: Orientation;
    /**
     * Determines the direction of the branch axis under the current trunk orientation.
     * Defaults to "normal".
     */
    branchDirection?: BranchDirection;
    /**
     * A function that determines the trunk-axis position on the canvas where 
     * the focal node should be aligned to, given the trunk-axis size of the canvas as reference. 
     * Should return a number of pixels counting from the trunk-axis starting edge of the canvas.
     * If the number is greater than the canvas size, will use the canvas size.
     * Defaults to 1/2 of the canvas size.
     */
    focalPositionTrunk?: (canvasSizeTrunk: number) => number;
    /**
     * A function that determines the branch-axis position on the canvas where 
     * the focal node should be aligned to, given the branch-axis size of the canvas as reference. 
     * Should return a number of pixels counting from the branch-axis starting edge of the canvas.
     * If the number is greater than the canvas size, will use the canvas size.
     * Defaults to 1/2 of the canvas size.
     */
    focalPositionBranch?: (canvasSizeBranch: number) => number;
    /**
     * A function that determines the "anchor point" on the focal branch 
     * that should align to the focal position, given its size on the trunk axis. 
     * Should return a number of pixels counting from the starting edge of the branch.
     * If the number exceeds the focal branch size, will use the focal branch size.
     * Defaults to 1/2 of the focal branch size.
     */
    focalAnchorTrunk?: (focalBranchSize: number) => number;
    /**
     * A function that determines the "anchor point" on all active nodes 
     * that should align to the focal position, given their size on the branch axis. 
     * Should return a number of pixels counting from the starting edge of the node. 
     * If the number exceeds the node size, will use the node size.
     * Defaults to 1/2 of the node size.
     */
    focalAnchorBranch?: (activeNodeSize: number) => number;
}