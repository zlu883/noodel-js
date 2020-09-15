import Compass from './Compass';
import { Axis } from '../enums/Axis';
import NoodeView from './NoodeView';
import NoodelOptions from './NoodelOptions';
import Vector2D from './Vector2D';
import Noode from '../main/Noode';

export default interface NoodelView {

    idCount: number;
    idMap: Map<string, {view: NoodeView, viewModel: Noode}>;
    throttleMap: Map<string, boolean>;
    debounceMap: Map<string, number>;
    eventQueue: (() => any)[];

    root: NoodeView;
    focalParent: NoodeView;
    focalLevel: number;
    
    trunkOffset: number;
    /**
     * This is the expected offset if the trunk is aligned to the current focal branch.
     */
    trunkOffsetAligned: number;
    applyTrunkMove: boolean;
    ignoreTransitionEnd?: boolean;

    showLimits: Compass;
    limitIndicatorTimeout?: number;

    /**
     * This is the offset of the trunk when panning begins.
     */
    panOffsetOriginTrunk: number;
    /**
     * This is the offset of the focal branch when panning begins.
     */
    panOffsetOriginFocalBranch: number;
    panAxis: Axis;

    isShiftKeyPressed?: boolean;
    /**
     * Transient holder for the noode that registered a pointerup event, removed after one frame.
     * Used by HammerJS handlers to determine the origin of tap input.
     */
    pointerUpSrcNoode?: NoodeView;
    /**
     * The focal noode when a pan started. Used for triggering focal change events on pan end.
     */
    panStartFocalNoode?: NoodeView;

    isInInspectMode: boolean;

    // references to DOM elements mainly for calculating positions
    canvasEl?: Element;
    trunkEl?: Element;
    
    hammerJsInstance?: HammerManager;

    containerSize: Vector2D;
    options: NoodelOptions;

    onHashChanged?: () => any;

    isFirstRenderDone?: boolean;

    lastPanTimestamp?: number;
    swipeVelocityBuffer?: number[];
}