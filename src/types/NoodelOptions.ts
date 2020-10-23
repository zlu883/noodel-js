import { BranchDirection } from './BranchDirection';
import { Orientation } from './Orientation';

/**
 * Global options for a noodel.
 */
export default interface NoodelOptions {
    /**
     * The number of levels of descendent branches to show
     * after the current focal branch. Defaults to 1.
     */
    visibleSubtreeDepth?: number;
    /**
     * If true, will keep the current branch depth (if possible) when
     * tapping on the sibling of an ancestor. Useful to create an effect similar to conventional
     * navigation menus. Defaults to false.
     */
    retainDepthOnTapNavigation?: boolean;
    /**
     * Amount of time to wait in ms (until no more consecutive hits) before showing the 
     * subtree of the focal noode, when moving the focal branch. Mainly a performance hack
     * to prevent rapid toggling of subtree elements. Defaults to 360.
     */
    subtreeDebounceInterval?: number;
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
     * Global option for enabling resize detection on ALL noodes and branches.
     * When enabled, will automatically align the positioning of elements when
     * noode/branch resizes are detected.
     * Defaults to true.
     */
    useResizeDetection?: boolean;
    /**
     * Global option for enabling overflow detection on ALL noodes. When enabled, 
     * will automatically check for content overflow on mount, noode resize
     * (if resize detection is enabled), and when exiting inspect mode.
     * Defaults to false.
     */
    useOverflowDetection?: boolean;
    /**
     * Number of pixels to move for every pixel swiped in the branch axis. Defaults to 1.
     */
    swipeMultiplierBranch?: number;
    /**
     * Number of pixels to move for every pixel swiped in the trunk axis. Defaults to 1.
     */
    swipeMultiplierTrunk?: number;
    /**
     * Number of noodes (per unit of velocity) to snap across after a swipe is released.
     * Defaults to 1.
     */
    snapMultiplierBranch?: number;
    /**
     * Number of levels (per unit of velocity) to snap across after a swipe is released.
     * Defaults to 1.
     */
    snapMultiplierTrunk?: number;
    /**
     * Determines whether routing should be enabled for this noodel. Defaults to true.
     */
    useRouting?: boolean;
    /**
     * Whether to render the limit indicators of the canvas. Defaults to true.
     */
    showLimitIndicators?: boolean;
    /**
     * Whether to render the child indicators of noodes. Defaults to true.
     */
    showChildIndicators?: boolean;
    /**
     * Whether to show noode overflow indicators if overflow is detected. Defaults
     * to false.
     */
    showOverflowIndicators?: boolean;
    /**
     * Whether to render the branch backdrop elements. Defaults to false.
     */
    showBranchBackdrops?: boolean;
    /**
     * Determines the direction of the trunk axis. Defaults to "ltr" (left to right).
     */
    orientation?: Orientation;
    /**
     * Determines the direction of the branch axis under the current trunk orientation.
     * Defaults to "normal".
     */
    branchDirection?: BranchDirection;
}