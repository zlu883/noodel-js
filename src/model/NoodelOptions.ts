import Noode from '@/main/Noode';

export default interface NoodelOptions {

    visibleSubtreeDepth?: number;
    swipeFrictionBranch?: number;
    swipeFrictionTrunk?: number;
    swipeWeightBranch?: number;
    swipeWeightTrunk?: number;
    useRouting?: boolean;
    onMount?: () => any;
    onFocalNoodeChange?: (to: Noode, from: Noode) => any;
    onFocalParentChange?: (to: Noode, from: Noode) => any;
}