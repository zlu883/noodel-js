import ResizeSensor from "../util/ResizeSensor";
import NoodeOptions from './NoodeOptions';
import ComponentContent from './ComponentContent';

export default interface NoodeState {

    id: string;
    index: number;
    level: number;
    children: NoodeState[];
    activeChildIndex: number;
    content: string | ComponentContent;
    className: string[];
    style: object;

    parent: NoodeState;
    /**
     * Toggles visibility of child branch via display: none.
     */
    isBranchVisible: boolean;
    /**
     * If true, will hide child branch with opacity: 0 instead of display: none.
     * Used temporarily for setting up resize sensors.
     */
    isBranchTransparent: boolean;
    isFocalParent: boolean;
    isActive: boolean;

    trunkRelativeOffset: number;
    /**
     * This is the orientation-agnostic offset of this noode's child branch counting from
     * the *start* of the branch axis. Does not take into account the focal position.
     */
    branchOffset: number;
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
    branchEl?: HTMLDivElement;
    branchBoxEl?: HTMLDivElement;

    resizeSensor?: ResizeSensor;
    branchResizeSensor?: ResizeSensor;

    options?: NoodeOptions;
}
