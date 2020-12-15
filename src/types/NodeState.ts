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

        el: HTMLDivElement;
        branchEl: HTMLDivElement;
        branchSliderEl: HTMLDivElement;

        vm: NoodelNode;

        isDeleted: boolean;
        isDetached: boolean;
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
     * If true, will force the branch to show with opacity: 0 even if it isn't visible,
     * for capturing sizes.
     */
    forceVisible: boolean;
    isFocalParent: boolean;
    isActive: boolean;
    /**
     * Whether this node is in the lineage of active nodes starting from the root.
     * This is used to check whether a branch should be visible.
     */
    isActiveLineage: boolean;

    applyBranchMove: boolean;
    /**
     * Transient orientation agnostic offset of this node's child branch applied when the branch
     * needs to "escape" the middle of a transition while preserving its other state
     * but still keeping the visual position.
     */
    branchTransitOffset: number;

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
