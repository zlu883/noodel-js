import Vector2D from './Vector2D';
import { ResizeSensor } from 'css-element-queries';

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
    /**
     * This is the expected offset if a branch is aligned to its active index.
     */
    childBranchOffsetAligned: number;
    /**
     * Takes precedence over the normal child branch offset. Used to override transition effects.
     */
    childBranchOffsetForced: number;

    branchRelativeOffset: number;

    size: number;
    branchSize: number;

    posSnapshot?: Vector2D;
    flipInvert: number;

    el?: Element;
    childBranchEl?: Element;

    resizeSensor?: ResizeSensor;
}
