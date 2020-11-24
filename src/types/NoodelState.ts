import { NoodelAxis } from './NoodelAxis';
import NodeState from './NodeState';
import NoodelOptions from './NoodelOptions';
import NoodelEventMap from './NoodelEventMap';

export default interface NoodelState {

    /**
     * Object container for state that are not used for
     * rendering the view and should be marked raw.
     */
    r: {
        containerEl: Element;
        vueInstance: any;
         
        idCount: number;
        idMap: Map<string, NodeState>;
        throttleMap: Map<string, boolean>;
        debounceMap: Map<string, number>;
        eventListeners: Map<keyof NoodelEventMap, NoodelEventMap[keyof NoodelEventMap][]>;
        eventQueue: Function[];
        limitIndicatorTimeout: number;
        isShiftKeyPressed: boolean;
        /**
         * Transient holder for the node that registered a pointerup event, removed after one frame.
         * Used by HammerJS handlers to determine the origin of tap input.
         */
        pointerUpSrcNode: NodeState;
        /**
         * The focal node when a pan started. Used for triggering focal change events on pan end.
         */
        panStartFocalNode: NodeState;

        canvasEl: HTMLDivElement;
        trunkEl: HTMLDivElement;

        hammerJsInstance: HammerManager;
        /**
         * The current pan axis, if panning. Otherwise is null.
         */
        panAxis: NoodelAxis;
        lastPanTimestamp: number;
        lastPanDistanceX: number;
        lastPanDistanceY: number;
        swipeVelocityBuffer: number[];
        onHashChanged: () => any;
    };

    isMounted: boolean;

    root: NodeState;
    focalParent: NodeState;
    focalLevel: number;

    applyTrunkMove: boolean;
    /**
     * Transient orientation-agnostic offset of the trunk caused by panning,
     * relative to the anchor point of the current focal branch.
     */
    trunkMoveOffset: number;
        /**
     * Transient orientation-agnostic offset of the focal branch 
     * caused by panning, relative to the anchor point of the focal node.
     */
    branchMoveOffset: number;
    /**
     * Transient orientation agnostic offset of the trunk applied when the trunk
     * needs to "escape" the middle of a transition while preserving its other state
     * but still keeping the visual position.
     */
    trunkTransitOffset: number;

    branchStartReached: boolean;
    branchEndReached: boolean;
    trunkStartReached: boolean;
    trunkEndReached: boolean;

    isInInspectMode: boolean;

    canvasSizeBranch: number;
    canvasSizeTrunk: number;
    options: NoodelOptions;
}