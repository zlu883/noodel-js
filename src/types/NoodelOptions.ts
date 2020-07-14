import Noode from '@/main/Noode';

export default interface NoodelOptions {

    visibleSubtreeDepth?: number;
    swipeFrictionBranch?: number;
    swipeFrictionTrunk?: number;
    swipeWeightBranch?: number;
    swipeWeightTrunk?: number;
    useRouting?: boolean;
    useKeyNavigation?: boolean;
    useWheelNavigation?: boolean;
    useSwipeNavigation?: boolean;
    useTapNavigation?: boolean;
    useInspectModeKey?: boolean;
    useInspectModeDoubleTap?: boolean;
    onMount?: () => any;
    onFocalNoodeChange?: (current: Noode, prev: Noode) => any;
    onFocalParentChange?: (current: Noode, prev: Noode) => any;
    onEnterInspectMode?: (noode: Noode) => any;
    onExitInspectMode?: (noode: Noode) => any;
}