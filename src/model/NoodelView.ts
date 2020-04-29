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
    trunkOffsetOrigin: number;
    trunkRelativeOffset: number;

    showLimits: Compass;
    movingAxis: Axis;
    isLocked?: boolean; // if locked, user interactions will not move the carousel
    limitIndicatorTimeout?: number;

    hasPress: boolean;
    hasSwipe: boolean;

    // The content box element of the noode where pointerdown events originated.
    // Used to check the presence of inner scrolling.
    pointerDownSrcContentBox?: Element;
    // The path of the noode where pointerdown events originated.
    // Used to determine the target for jump navigation.
    pointerDownSrcNoodePath?: number[];
    doInnerScroll?: boolean;
    innerScrollOriginLeft?: number;
    innerScrollOriginTop?: number;

    lastSwipeDelta: number;
    totalSwipeDelta: number;
    trunkSnapAnimation?: any;
    branchSnapAnimation?: any;

    containerSize: Vector2D;
    options: NoodelOptions;
}