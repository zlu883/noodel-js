import NoodeDefinition from '../types/NoodeDefinition';
import NoodelOptions from '../types/NoodelOptions';
import NoodeState from '../types/NoodeState';
import NoodelState from '../types/NoodelState';
import { showActiveSubtree } from './noodel-mutate';
import { setupRouting, unsetRouting } from './noodel-routing';
import NoodeOptions from '../types/NoodeOptions';
import { generateNoodeId, registerNoodeSubtree, findNoode, isIdRegistered } from './id-register';
import { alignNoodelOnJump } from './noodel-navigate';
import { cancelPan } from './noodel-pan';
import { resetAlignment } from './noodel-align';
import { traverseDescendents } from './noodel-traverse';
import { attachBranchResizeSensor, attachCanvasResizeSensor, attachResizeSensor, detachBranchResizeSensor, detachResizeSensor } from './resize-detect';
import Noode from '../main/Noode';
import { reactive, markRaw } from 'vue';

export function setupNoodel(root: NoodeDefinition, options: NoodelOptions): NoodelState {

    let noodelState: NoodelState = reactive({
        r: markRaw({
            containerEl: null,
            vueInstance: null,
            idCount: -1,
            idMap: new Map([]),
            throttleMap: new Map([]),
            debounceMap: new Map([]),
            eventListeners: new Map([
                ['mount', []], 
                ['focalNoodeChange', []],
                ['focalParentChange', []],
                ['enterInspectMode', []],
                ['exitInspectMode', []],
            ]),
            eventQueue: [],
            onHashChanged: null,
            lastPanTimestamp: null,
            panOriginTrunk: null,
            panOriginBranch: null,
            panAxis: null,
            swipeVelocityBuffer: [],
            isShiftKeyPressed: false,
            limitIndicatorTimeout: null,
            pointerUpSrcNoode: null,
            panStartFocalNoode: null,
            ignoreTransitionEnd: false,
            isMounted: false,
            canvasEl: null,
            trunkEl: null,
            hammerJsInstance: null,
        }),

        root: null,
        focalParent: null,
        focalLevel: 1,

        trunkOffset: 0,
        applyTrunkMove: false,

        branchStartReached: false,
        branchEndReached: false,
        trunkStartReached: false,
        trunkEndReached: false,

        isInInspectMode: false,

        containerHeight: 0,
        containerWidth: 0,

        options: {
            visibleSubtreeDepth: 1,
            retainDepthOnTapNavigation: false,
            swipeMultiplierBranch: 1,
            swipeMultiplierTrunk: 1,
            snapMultiplierBranch: 1,
            snapMultiplierTrunk: 1,
            subtreeDebounceInterval: 360,
            useRouting: true,
            useKeyNavigation: true,
            useWheelNavigation: true,
            useSwipeNavigation: true,
            useTapNavigation: true,
            useInspectModeKey: true,
            useInspectModeDoubleTap: true,
            useResizeDetection: true,
            useOverflowDetection: false,
            showLimitIndicators: true,
            showBranchBackdrops: false,
            showChildIndicators: true,
            orientation: "ltr",
            branchDirection: "normal"
        },
    });

    let rootNoode = buildNoodeView(noodelState, root, 0, null, true, 0);

    noodelState.root = rootNoode;
    noodelState.focalParent = rootNoode;

    registerNoodeSubtree(noodelState, rootNoode);
    parseAndApplyOptions(options, noodelState);
    showActiveSubtree(noodelState, rootNoode, noodelState.options.visibleSubtreeDepth);

    if (noodelState.options.useRouting) {
        let hash = window.location.hash;

        if (hash) {
            let target = findNoode(noodelState, hash.substr(1));

            if (target && target.parent) {
                alignNoodelOnJump(noodelState, target);
            }
        }
    }

    return noodelState;
}

/**
 * Recursively parses the given HTML element into a noode tree. 
 */
export function parseHTMLToNoode(el: Element): NoodeDefinition {

    let content = '';
    let children: NoodeDefinition[] = [];

    for (let i = 0; i < el.childNodes.length; i++) {
        const node = el.childNodes[i];

        if (node.nodeType === Node.TEXT_NODE) {
            content += node.textContent; // Depends on css white-space property for ignoring white spaces
        }
        else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.nodeName === "DIV" && (node as Element).className.split(' ').some(c => c === 'noode')) {
                children.push(parseHTMLToNoode(node as Element));
            }
            else {
                content += (node as Element).outerHTML; // Depends on css white-space property for ignoring white spaces
            }
        }
    }

    let attributes = (el as HTMLElement).dataset;

    return {
        id: attributes.id || null,
        content: content || null,
        isActive: 'active' in attributes,
        children: children,
        classNames: {
            noode: attributes.classNoode,
            contentBox: attributes.classContentBox,
            childIndicator: attributes.classChildIndicator,
            overflowIndicatorLeft: attributes.classOverflowIndicatorLeft,
            overflowIndicatorRight: attributes.classOverflowIndicatorRight,
            overflowIndicatorTop: attributes.classOverflowIndicatorTop,
            overflowIndicatorBottom: attributes.classOverflowIndicatorBottom,
            branch: attributes.classBranch,
            branchBackdrop: attributes.classBranchBackdrop,
        },
        styles: {
            noode: attributes.styleNoode,
            contentBox: attributes.styleContentBox,
            childIndicator: attributes.styleChildIndicator,
            overflowIndicatorLeft: attributes.styleOverflowIndicatorLeft,
            overflowIndicatorRight: attributes.styleOverflowIndicatorRight,
            overflowIndicatorTop: attributes.styleOverflowIndicatorTop,
            overflowIndicatorBottom: attributes.styleOverflowIndicatorBottom,
            branch: attributes.styleBranch,
            branchBackdrop: attributes.styleBranchBackdrop,
        },
        options: {
            useResizeDetection: 'useResizeDetection' in attributes || null,
            useBranchResizeDetection: 'useBranchResizeDetection' in attributes || null,
            useOverflowDetection: 'useOverflowDetection' in attributes || null,
            showBranchBackdrop: 'showBranchBackdrop' in attributes || null,
            showChildIndicator: 'showChildIndicator' in attributes || null,
            showOverflowIndicators: 'showOverflowIndicators' in attributes || null
        }
    };
}

export function setupCanvasEl(noodel: NoodelState) {

    let rect = noodel.r.canvasEl.getBoundingClientRect();

    noodel.containerWidth = rect.width;
    noodel.containerHeight = rect.height;

    attachCanvasResizeSensor(noodel);
}

export function parseAndApplyOptions(options: NoodelOptions, noodel: NoodelState) {

    let oldOrientation = noodel.options.orientation;
    let oldBranchDirection = noodel.options.branchDirection;
    let oldUseResizeDetection = noodel.options.useResizeDetection;

    noodel.options = {
        ...noodel.options,
        ...options
    }

    if (!options.useSwipeNavigation) cancelPan(noodel);

    if (noodel.options.useRouting) {
        setupRouting(noodel);
    }
    else {
        unsetRouting(noodel);
    }

    if (noodel.r.isMounted) {
        let newOrientation = noodel.options.orientation;
        let newBranchDirection = noodel.options.branchDirection;

        if (((oldOrientation === 'ltr' || oldOrientation === 'rtl') && (newOrientation === 'ttb' || newOrientation === 'btt')) ||
            ((oldOrientation === 'ttb' || oldOrientation === 'btt') && (newOrientation === 'ltr' || newOrientation === 'rtl'))) {
            resetAlignment(noodel);
        }
        else if (newBranchDirection !== oldBranchDirection) {
            // prevents transition going haywire, not necessary if orientation also changes since
            // realignAll will do it
            traverseDescendents(noodel.root, noode => noode.applyBranchMove = false, true);
        }

        let newUseResizeDetection = noodel.options.useResizeDetection;

        if (oldUseResizeDetection && !newUseResizeDetection) {
            traverseDescendents(noodel.root, desc => {
                detachBranchResizeSensor(desc);
                detachResizeSensor(desc);
            }, true);
        }
        else if (newUseResizeDetection && !oldUseResizeDetection) {
            traverseDescendents(noodel.root, desc => {
                attachBranchResizeSensor(noodel, desc);
                attachResizeSensor(noodel, desc);
            }, true);
        }
    }
}

export function parseAndApplyNoodeOptions(noodel: NoodelState, options: NoodeOptions, noode: NoodeState) {

    let oldUseResizeDetection = typeof noode.options.useResizeDetection === "boolean"
        ? noode.options.useResizeDetection
        : noodel.options.useResizeDetection;
    let oldUseBranchResizeDetection = typeof noode.options.useBranchResizeDetection === 'boolean'
        ? noode.options.useBranchResizeDetection
        : noodel.options.useResizeDetection;

    noode.options = {
        ...noode.options,
        ...options
    };

    if (noodel.r.isMounted) {
        let newUseResizeDetection = typeof noode.options.useResizeDetection === "boolean"
            ? noode.options.useResizeDetection
            : noodel.options.useResizeDetection;
        let newUseBranchResizeDetection = typeof noode.options.useBranchResizeDetection === 'boolean'
            ? noode.options.useBranchResizeDetection
            : noodel.options.useResizeDetection;

        if (oldUseResizeDetection && !newUseResizeDetection) {
            detachResizeSensor(noode);
        }
        else if (newUseResizeDetection && !oldUseResizeDetection) {
            attachResizeSensor(noodel, noode);
        }

        if (oldUseBranchResizeDetection && !newUseBranchResizeDetection) {
            detachBranchResizeSensor(noode);
        }
        else if (newUseBranchResizeDetection && !oldUseBranchResizeDetection) {
            attachBranchResizeSensor(noodel, noode);
        }
    }
}

export function buildNoodeView(noodel: NoodelState, def: NoodeDefinition, index: number, parent: NoodeState, isActive: boolean, branchRelativeOffset: number): NoodeState {

    let isRoot = parent === null;
    if (!def.children) def.children = [];
    if (!def.classNames) def.classNames = {};
    if (!def.styles) def.styles = {};
    if (!def.options) def.options = {};

    // parse and validate ID
    let newId = null;

    if (typeof def.id === 'string') {
        if (isIdRegistered(noodel, def.id)) {
            throw new Error("Duplicate ID for new noode: " + def.id);
        }

        newId = def.id;
    }
    else {
        newId = generateNoodeId(noodel);
    }

    // parse and validate active child index
    let activeChildIndex = def.children.length > 0 ? 0 : null;

    for (let i = 0; i < def.children.length; i++) {
        if (def.children[i].isActive) {
            activeChildIndex = i;
            break;
        }
    }

    let noodeState: NoodeState = reactive({
        r: markRaw({
            eventListeners: new Map([
                ['enterFocus', []], 
                ['exitFocus', []],
                ['childrenEnterFocus', []],
                ['childrenExitFocus', []],
            ]),
            isRoot: isRoot,           
            ignoreTransitionEnd: false,
            contentBoxEl: null,
            el: null,
            branchEl: null,
            branchBackdropEl: null,
            resizeSensor: null,
            branchResizeSensor: null,
            vm: null,
            fade: false
        }),
        index: index,
        level: isRoot ? 0 : parent.level + 1,
        isBranchVisible: false,
        isBranchTransparent: true, // initialize to transparent state for capturing size
        isFocalParent: isRoot, // only initialze root as focal parent
        isActive: isActive,
        isInInspectMode: false,

        branchOffset: 0,
        applyBranchMove: false,

        branchRelativeOffset: branchRelativeOffset,
        trunkRelativeOffset: isRoot ? 0 : parent.trunkRelativeOffset + parent.branchSize,
        
        size: 0,
        branchSize: 0,
        
        parent: parent as any,
        id: newId,
        children: [],
        content: def.content || null,
        classNames: {
            ...def.classNames
        },
        styles: {
            ...def.styles
        },
        activeChildIndex: activeChildIndex,
        options: {
            useResizeDetection: null,
            useBranchResizeDetection: null,
            useOverflowDetection: null,
            showBranchBackdrop: null,
            showChildIndicator: null,
            showOverflowIndicators: null,
        },
        hasOverflowTop: false,
        hasOverflowLeft: false,
        hasOverflowBottom: false,
        hasOverflowRight: false
    });

    noodeState.r.vm = new (Noode as any)(noodeState, noodel);
    parseAndApplyNoodeOptions(noodel, def.options, noodeState);

    for (let i = 0; i < def.children.length; i++) {
        noodeState.children.push(buildNoodeView(noodel, def.children[i], i, noodeState, i === activeChildIndex, 0));
    }

    return noodeState;
}