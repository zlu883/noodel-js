export default interface NoodeView {

    id: string;
    children: NoodeView[];
    activeChildIndex: number;
    content: string;

    parent: NoodeView;

    isChildrenVisible: boolean;
    isFocalParent: boolean;
    isActive: boolean;

    branchOffset: number;
    branchOffsetOrigin: number;
    branchRelativeOffset: number;

    size: number;
    branchSize: number;
}
