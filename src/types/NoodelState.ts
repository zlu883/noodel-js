import { NoodelAxis } from './NoodelAxis';
import NoodeState from './NoodeState';
import NoodelOptions from './NoodelOptions';
import Noode from '../main/Noode';

export default interface NoodelState {

    idCount: number;
    idMap: Map<string, {viewState: NoodeState, viewModel: Noode}>;
    throttleMap: Map<string, boolean>;
    debounceMap: Map<string, number>;
    eventQueue: (() => any)[];

    root: NoodeState;
    focalParent: NoodeState;
    focalLevel: number;
    
    /**
     * This is the orientation-agnostic offset of the trunk counting from
     * the *start* of the trunk axis. Does not take into account the focal position.
     */
    trunkOffset: number;
    applyTrunkMove: boolean;
    ignoreTransitionEnd?: boolean;

    branchStartReached: boolean;
    branchEndReached: boolean;
    trunkStartReached: boolean;
    trunkEndReached: boolean;

    limitIndicatorTimeout?: number;

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

    isShiftKeyPressed?: boolean;
    /**
     * Transient holder for the noode that registered a pointerup event, removed after one frame.
     * Used by HammerJS handlers to determine the origin of tap input.
     */
    pointerUpSrcNoode?: NoodeState;
    /**
     * The focal noode when a pan started. Used for triggering focal change events on pan end.
     */
    panStartFocalNoode?: NoodeState;

    isInInspectMode: boolean;

    // references to DOM elements mainly for calculating positions
    canvasEl?: Element;
    trunkEl?: Element;
    
    hammerJsInstance?: HammerManager;

    containerHeight: number;
    containerWidth: number;
    options: NoodelOptions;

    onHashChanged?: () => any;

    isFirstRenderDone?: boolean;

    lastPanTimestamp?: number;
    swipeVelocityBuffer?: number[];
}