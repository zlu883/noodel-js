import Noode from '@/main/Noode';

export default interface NoodelOptions {

    visibleSubtreeDepth?: number;
    swipeFrictionBranch?: number;
    swipeFrictionTrunk?: number;
    swipeWeightBranch?: number;
    swipeWeightTrunk?: number;
    useRouting?: boolean;
    onMount?: () => any;
    onFocalNoodeChange?: (current: Noode, prev: Noode) => any;
    onFocalParentChange?: (current: Noode, prev: Noode) => any;
}