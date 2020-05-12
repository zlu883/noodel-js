export default interface NoodeView {

    id: string;
    index: number;
    level: number;
    children: NoodeView[];
    activeChildIndex: number;
    content: string;

    parent: NoodeView;

    isChildrenVisible: boolean;
    isFocalParent: boolean;
    isActive: boolean;

    trunkRelativeOffset: number;
    childBranchOffset: number;
    childBranchOffsetAligned: number;

    branchRelativeOffset: number;

    size: number;
    branchSize: number;

    flipInvert: number;

    el?: Element;
    childBranchEl?: Element;
}
