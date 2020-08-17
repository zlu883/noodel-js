import Noode from '@/main/Noode';

export default interface NoodelOptions {

    visibleSubtreeDepth?: number;
    retainDepthOnTapNavigation?: boolean;
    swipeMultiplierBranch?: number;
    swipeMultiplierTrunk?: number;
    snapMultiplierBranch?: number;
    snapMultiplierTrunk?: number;
    subtreeDebounceInterval?: number;
    useRouting?: boolean;
    useKeyNavigation?: boolean;
    useWheelNavigation?: boolean;
    useSwipeNavigation?: boolean;
    useTapNavigation?: boolean;
    useInspectModeKey?: boolean;
    useInspectModeDoubleTap?: boolean;
    skipResizeDetection?: boolean;
    showLimitIndicators?: boolean;
    showChildIndicators?: boolean;
    showBranchColumns?: boolean;
    onMount?: () => any | null;
    onFocalNoodeChange?: (current: Noode, prev: Noode) => any | null;
    onFocalParentChange?: (current: Noode, prev: Noode) => any | null;
    onEnterInspectMode?: (noode: Noode) => any | null;
    onExitInspectMode?: (noode: Noode) => any | null;
}