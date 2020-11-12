import { NoodelAxis } from './NoodelAxis';
import NoodeState from './NoodeState';
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
        idMap: Map<string, NoodeState>;
        throttleMap: Map<string, boolean>;
        debounceMap: Map<string, number>;
        eventListeners: Map<keyof NoodelEventMap, NoodelEventMap[keyof NoodelEventMap][]>;
        eventQueue: Function[];
        limitIndicatorTimeout: number;
        isShiftKeyPressed: boolean;
        /**
         * Transient holder for the noode that registered a pointerup event, removed after one frame.
         * Used by HammerJS handlers to determine the origin of tap input.
         */
        pointerUpSrcNoode: NoodeState;
        /**
         * The focal noode when a pan started. Used for triggering focal change events on pan end.
         */
        panStartFocalNoode: NoodeState;

        ignoreTransitionEnd: boolean;

        canvasEl: HTMLDivElement;
        trunkEl: HTMLDivElement;

        hammerJsInstance: HammerManager;
        /**
         * This is the offset of the trunk when panning begins.
         */
        panOriginTrunk: number;
        /**
         * This is the offset of the focal branch when panning begins.
         */
        panOriginBranch: number;
        /**
         * The current pan axis, if panning. Otherwise is null.
         */
        panAxis: NoodelAxis;
        lastPanTimestamp: number;
        swipeVelocityBuffer: number[];
        onHashChanged: () => any;
    };

    isMounted: boolean;

    root: NoodeState;
    focalParent: NoodeState;
    focalLevel: number;

    /**
     * This is the orientation-agnostic offset of the trunk counting from
     * the *start* of the trunk axis. Does not take into account the focal position.
     */
    trunkOffset: number;
    applyTrunkMove: boolean;

    branchStartReached: boolean;
    branchEndReached: boolean;
    trunkStartReached: boolean;
    trunkEndReached: boolean;

    isInInspectMode: boolean;

    containerHeight: number;
    containerWidth: number;
    options: NoodelOptions;
}