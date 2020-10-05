import Noode from '../main/Noode';
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
     * Global option for disabling resize detection on ALL noodes and branches.
     * Disabling resize detection may give a slight performance boost. Use this option if you
     * know that the size of noodes and branches will never change after creation.
     * Defaults to false.
     */
    skipResizeDetection?: boolean;
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
     * Whether to render the branch backdrop elements. Defaults to false.
     */
    showBranchBackdrops?: boolean;
    /**
     * Determines the direction of the trunk axis. Defaults to ltr (left to right).
     */
    orientation?: Orientation;
    /**
     * Determines the direction of the branch axis under the current trunk orientation.
     * Defaults to "normal".
     */
    branchDirection?: BranchDirection;
    /**
     * Callback after the noodel has mounted (i.e. fully rendered onto the DOM) and properly aligned
     * after the first render. Changes to the view model from here onward
     * will sync with the view and trigger animation effects.
     */
    onMount?: () => any | null;
    /**
     * Handler called once after noodel creation, and whenever the focal noode
     * has changed. 
     * @param current the current focal noode
     * @param prev the previous focal noode, null on initial call
     */
    onFocalNoodeChange?: (current: Noode, prev: Noode) => any | null;
    /**
     * Handler called once after noodel creation, and whenever the focal parent
     * has changed.
     * @param current the current focal parent
     * @param prev the previous focal parent, null on initial call
     */
    onFocalParentChange?: (current: Noode, prev: Noode) => any | null;
    /**
     * Handler called when entered inspect mode.
     * @param noode the current focal noode
     */
    onEnterInspectMode?: (noode: Noode) => any | null;
    /**
     * Handler called when exited inspect mode.
     * @param noode the current focal noode
     */
    onExitInspectMode?: (noode: Noode) => any | null;
}