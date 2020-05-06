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

    offset: number;
    branchOffset: number;
    branchOffsetAligned: number;

    noodeOffset: number;

    size: number;
    branchSize: number;
}
