export default interface NoodelOptions {

    initialPath?: number[];
    visibleSubtreeDepth?: number;
    swipeFrictionBranch?: number;
    swipeFrictionTrunk?: number;
    swipeWeightBranch?: number;
    swipeWeightTrunk?: number;
    mounted?: () => any;
}