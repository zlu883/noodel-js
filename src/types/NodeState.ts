import ResizeSensor from "../util/ResizeSensor";
import NodeOptions from './NodeOptions';
import ComponentContent from './ComponentContent';
import NoodelNode from '../main/NoodelNode';
import NodeEventMap from './NodeEventMap';
import NodeCss from './NodeCss';

export default interface NodeState {

    /**
     * Object container for state that are not used for
     * rendering the view and should be marked raw.
     */
    r: {
        eventListeners: Map<keyof NodeEventMap, NodeEventMap[keyof NodeEventMap][]>;

        isRoot: boolean;
        ignoreTransitionEnd: boolean;

        contentBoxEl: HTMLDivElement;
        el: HTMLDivElement;
        branchEl: HTMLDivElement;
        branchSliderEl: HTMLDivElement;

        resizeSensor: ResizeSensor;
        branchResizeSensor: ResizeSensor;

        vm: NoodelNode;
        /**
         * Use to check need for fade out position adjustment during node deletion
         */
        fade: boolean;
    };

    id: string;
    index: number;
    level: number;
    children: NodeState[];
    activeChildIndex: number;
    content: string | ComponentContent;
    branchContent: string | ComponentContent;
    classNames: NodeCss;
    styles: NodeCss;

    parent: NodeState;

    isBranchMounted: boolean;
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

    /**
     * This is the orientation-agnostic offset of this node's child branch counting from
     * the *start* of the branch axis. Does not take into account the focal position.
     */
    branchOffset: number;
    applyBranchMove: boolean;
    /**
     * Transient orientation-agnostic offset of this node's child branch 
     * caused by panning or animation effects,
     * relative to the anchor point of the active node.
     */
    branchMoveOffset: number;

    size: number;
    branchSize: number;

    /**
     * Orientation-agnostic offset of this node's child branch relative to the start of the trunk.
     */
    trunkRelativeOffset: number;
    /**
     * Orientation-agnostic offset of this node relative to the start of its containing branch.
     */
    branchRelativeOffset: number;

    /**
     * Extra variable to prevent Vue from needing to patch every single node on change,
     * as a performance hack.
     */
    isInInspectMode: boolean;

    options: NodeOptions;
}
