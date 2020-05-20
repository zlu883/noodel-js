export default interface NoodelOptions {

    visibleSubtreeDepth?: number;
    swipeFrictionBranch?: number;
    swipeFrictionTrunk?: number;
    swipeWeightBranch?: number;
    swipeWeightTrunk?: number;
    mounted?: () => any;
}