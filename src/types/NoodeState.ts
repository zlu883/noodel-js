import ResizeSensor from "../util/ResizeSensor";
import NoodeOptions from './NoodeOptions';
import ComponentContent from './ComponentContent';
import Noode from '../main/Noode';
import NoodeClassNames from './NoodeClassNames';
import NoodeStyles from './NoodeStyles';
import NoodeEventMap from './NoodeEventMap';

export default interface NoodeState {

    /**
     * Object container for state that are not used for
     * rendering the view and should be marked raw.
     */
    r: {
        eventListeners: Map<keyof NoodeEventMap, NoodeEventMap[keyof NoodeEventMap][]>;

        isRoot: boolean;
        ignoreTransitionEnd: boolean;

        contentBoxEl: HTMLDivElement;
        el: HTMLDivElement;
        branchEl: HTMLDivElement;
        branchBackdropEl: HTMLDivElement;

        resizeSensor: ResizeSensor;
        branchResizeSensor: ResizeSensor;

        vm: Noode;
        /**
         * Use to check need for fade out position adjustment during noode deletion
         */
        fade: boolean;
    };

    id: string;
    index: number;
    level: number;
    children: NoodeState[];
    activeChildIndex: number;
    content: string | ComponentContent;

    classNames: NoodeClassNames;
    styles: NoodeStyles;

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

    /**
     * This is the orientation-agnostic offset of this noode's child branch counting from
     * the *start* of the branch axis. Does not take into account the focal position.
     */
    branchOffset: number;
    applyBranchMove: boolean;

    size: number;
    branchSize: number;

    /**
     * Orientation-agnostic offset of this noode's child branch relative to the start of the trunk.
     */
    trunkRelativeOffset: number;
    /**
     * Orientation-agnostic offset of this noode relative to the start of its containing branch.
     */
    branchRelativeOffset: number;

    /**
     * Extra variable to prevent Vue from needing to patch every single noode on change,
     * as a performance hack.
     */
    isInInspectMode: boolean;

    hasOverflowTop: boolean;
    hasOverflowLeft: boolean;
    hasOverflowBottom: boolean;
    hasOverflowRight: boolean;

    options: NoodeOptions;
}
