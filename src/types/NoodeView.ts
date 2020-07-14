import { ResizeSensor } from 'css-element-queries';
import NoodeOptions from './NoodeOptions';
import ComponentContent from './ComponentContent';

export default interface NoodeView {

    id: string;
    index: number;
    level: number;
    children: NoodeView[];
    activeChildIndex: number;
    content: string | ComponentContent;
    className: string[];
    style: object;

    parent: NoodeView;
    /**
     * Toggles visibility of children via display: none.
     */
    isChildrenVisible: boolean;
    /**
     * If true, will hide children with opacity: 0 instead of display: none.
     * Used temporarily for setting up resize sensors.
     */
    isChildrenTransparent: boolean;
    isFocalParent: boolean;
    isActive: boolean;

    trunkRelativeOffset: number;
    childBranchOffset: number;
    /**
     * This is the expected offset if a branch is aligned to its active index.
     */
    childBranchOffsetAligned: number;
    applyBranchMove: boolean;
    ignoreTransitionEnd?: boolean;

    /**
     * Extra variable to prevent Vue from needing to patch every single noode on change,
     * as a performance hack.
     */
    isInInspectMode: boolean;

    branchRelativeOffset: number;

    size: number;
    branchSize: number;

    el?: Element;
    childBranchEl?: Element;

    resizeSensor?: ResizeSensor;
    branchResizeSensor?: ResizeSensor;

    options?: NoodeOptions;
}
