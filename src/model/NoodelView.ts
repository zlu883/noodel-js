import Compass from './Compass';
import { Axis } from '../enums/Axis';
import NoodeView from './NoodeView';
import NoodelOptions from './NoodelOptions';
import Vector2D from './Vector2D';

export default interface NoodelView {

    root: NoodeView;
    focalParent: NoodeView;
    focalLevel: number;
    
    trunkOffset: number;
    /**
     * This is the expected offset if the trunk is aligned to the current focal branch.
     */
    trunkOffsetAligned: number;

    showLimits: Compass;
    limitIndicatorTimeout?: number;

    /**
     * This is the offset of the trunk or focal branch when panning begins.
     */
    panOffsetOrigin: number;
    panAxis: Axis;

    hasPress: boolean;
    hasSwipe: boolean;

    /**
     *  The DOM element of the noode where pointerdown events originated.
     *  Used to check the presence of inner scrolling.
     */
    pointerDownSrcNoodeEl?: Element;
    /**
     * The noode where pointerdown events originated.
     * Used to determine the target for jump navigation.
     */
    pointerDownSrcNoode?: NoodeView;
    doInnerScroll?: boolean;
    innerScrollOriginLeft?: number;
    innerScrollOriginTop?: number;

    // references to DOM elements mainly for calculating positions
    canvasEl?: Element;
    trunkEl?: Element;
    focalBranchEl?: Element;

    containerSize: Vector2D;
    options: NoodelOptions;
}