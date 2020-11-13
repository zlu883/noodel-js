import NodeDefinition from '../types/NodeDefinition';
import NoodelOptions from '../types/NoodelOptions';
import NodeState from '../types/NodeState';
import NoodelState from '../types/NoodelState';
import { showActiveSubtree } from './noodel-mutate';
import { setupRouting, unsetRouting } from './noodel-routing';
import NodeOptions from '../types/NodeOptions';
import { generateNodeId, registerNodeSubtree, findNode, isIdRegistered } from './id-register';
import { alignNoodelOnJump } from './noodel-navigate';
import { cancelPan } from './noodel-pan';
import { resetAlignment } from './noodel-align';
import { traverseDescendents } from './noodel-traverse';
import { attachBranchResizeSensor, attachCanvasResizeSensor, attachResizeSensor, detachBranchResizeSensor, detachResizeSensor } from './resize-detect';
import NoodelNode from '../main/NoodelNode';
import { reactive, markRaw } from 'vue';

export function setupNoodel(root: NodeDefinition, options: NoodelOptions): NoodelState {

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
                ['focalNodeChange', []],
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
            pointerUpSrcNode: null,
            panStartFocalNode: null,
            ignoreTransitionEnd: false,
            canvasEl: null,
            trunkEl: null,
            hammerJsInstance: null,
        }),

        isMounted: false,

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

    let rootNode = buildNodeView(noodelState, root, 0, null, true, 0);

    noodelState.root = rootNode;
    noodelState.focalParent = rootNode;

    registerNodeSubtree(noodelState, rootNode);
    parseAndApplyOptions(options, noodelState);
    showActiveSubtree(rootNode, noodelState.options.visibleSubtreeDepth);

    if (noodelState.options.useRouting) {
        let hash = window.location.hash;

        if (hash) {
            let target = findNode(noodelState, hash.substr(1));

            if (target && target.parent) {
                alignNoodelOnJump(noodelState, target);
            }
        }
    }

    return noodelState;
}

/**
 * Recursively parses the given HTML element into a tree of noodel nodes. 
 */
export function parseHTMLToNode(el: Element): NodeDefinition {

    let content = '';
    let children: NodeDefinition[] = [];

    for (let i = 0; i < el.childNodes.length; i++) {
        const node = el.childNodes[i];

        if (node.nodeType === Node.TEXT_NODE) {
            content += node.textContent; // Depends on css white-space property for ignoring white spaces
        }
        else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.nodeName === "DIV" && (node as Element).className.split(' ').some(c => c === 'node')) {
                children.push(parseHTMLToNode(node as Element));
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
            node: attributes.classNode,
            contentBox: attributes.classContentBox,
            childIndicator: attributes.classChildIndicator,
            overflowIndicatorLeft: attributes.classOverflowIndicatorLeft,
            overflowIndicatorRight: attributes.classOverflowIndicatorRight,
            overflowIndicatorTop: attributes.classOverflowIndicatorTop,
            overflowIndicatorBottom: attributes.classOverflowIndicatorBottom,
            branch: attributes.classBranch,
            branchSlider: attributes.branchSlider,
            branchBackdrop: attributes.classBranchBackdrop,
        },
        styles: {
            node: attributes.styleNode,
            contentBox: attributes.styleContentBox,
            childIndicator: attributes.styleChildIndicator,
            overflowIndicatorLeft: attributes.styleOverflowIndicatorLeft,
            overflowIndicatorRight: attributes.styleOverflowIndicatorRight,
            overflowIndicatorTop: attributes.styleOverflowIndicatorTop,
            overflowIndicatorBottom: attributes.styleOverflowIndicatorBottom,
            branch: attributes.styleBranch,
            branchSlider: attributes.branchSlider,
            branchBackdrop: attributes.styleBranchBackdrop,
        },
        options: {
            useResizeDetection: attributes.useResizeDetection === 'true' ? true : attributes.useResizeDetection === 'false' ? false : null,
            useBranchResizeDetection: attributes.useBranchResizeDetection === 'true' ? true : attributes.useBranchResizeDetection === 'false' ? false : null,
            useOverflowDetection: attributes.useOverflowDetection === 'true' ? true : attributes.useOverflowDetection === 'false' ? false : null,
            showBranchBackdrop: attributes.showBranchBackdrop === 'true' ? true : attributes.showBranchBackdrop === 'false' ? false : null,
            showChildIndicator: attributes.showChildIndicator === 'true' ? true : attributes.showChildIndicator === 'false' ? false : null,
            showOverflowIndicators: attributes.showOverflowIndicators === 'true' ? true : attributes.showOverflowIndicators === 'false' ? false : null
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

    if (noodel.isMounted) {
        let newOrientation = noodel.options.orientation;
        let newBranchDirection = noodel.options.branchDirection;

        if (((oldOrientation === 'ltr' || oldOrientation === 'rtl') && (newOrientation === 'ttb' || newOrientation === 'btt')) ||
            ((oldOrientation === 'ttb' || oldOrientation === 'btt') && (newOrientation === 'ltr' || newOrientation === 'rtl'))) {
            resetAlignment(noodel);
        }
        else if (newBranchDirection !== oldBranchDirection) {
            // prevents transition going haywire, not necessary if orientation also changes since
            // realignAll will do it
            traverseDescendents(noodel.root, node => node.applyBranchMove = false, true);
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

export function parseAndApplyNodeOptions(noodel: NoodelState, options: NodeOptions, node: NodeState) {

    let oldUseResizeDetection = typeof node.options.useResizeDetection === "boolean"
        ? node.options.useResizeDetection
        : noodel.options.useResizeDetection;
    let oldUseBranchResizeDetection = typeof node.options.useBranchResizeDetection === 'boolean'
        ? node.options.useBranchResizeDetection
        : noodel.options.useResizeDetection;

    node.options = {
        ...node.options,
        ...options
    };

    if (noodel.isMounted) {
        let newUseResizeDetection = typeof node.options.useResizeDetection === "boolean"
            ? node.options.useResizeDetection
            : noodel.options.useResizeDetection;
        let newUseBranchResizeDetection = typeof node.options.useBranchResizeDetection === 'boolean'
            ? node.options.useBranchResizeDetection
            : noodel.options.useResizeDetection;

        if (oldUseResizeDetection && !newUseResizeDetection) {
            detachResizeSensor(node);
        }
        else if (newUseResizeDetection && !oldUseResizeDetection) {
            attachResizeSensor(noodel, node);
        }

        if (oldUseBranchResizeDetection && !newUseBranchResizeDetection) {
            detachBranchResizeSensor(node);
        }
        else if (newUseBranchResizeDetection && !oldUseBranchResizeDetection) {
            attachBranchResizeSensor(noodel, node);
        }
    }
}

export function buildNodeView(noodel: NoodelState, def: NodeDefinition, index: number, parent: NodeState, isActive: boolean, branchRelativeOffset: number): NodeState {

    let isRoot = parent === null;
    if (!def.children) def.children = [];
    if (!def.classNames) def.classNames = {};
    if (!def.styles) def.styles = {};
    if (!def.options) def.options = {};

    // parse and validate ID
    let newId = null;

    if (typeof def.id === 'string') {
        if (isIdRegistered(noodel, def.id)) {
            throw new Error("Duplicate ID for new node: " + def.id);
        }

        newId = def.id;
    }
    else {
        newId = generateNodeId(noodel);
    }

    // parse and validate active child index
    let activeChildIndex = def.children.length > 0 ? 0 : null;

    for (let i = 0; i < def.children.length; i++) {
        if (def.children[i].isActive) {
            activeChildIndex = i;
            break;
        }
    }

    let nodeState: NodeState = reactive({
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
            branchSliderEl: null,
            branchBackdropEl: null,
            resizeSensor: null,
            branchResizeSensor: null,
            vm: null,
            fade: false
        }),
        index: index,
        level: isRoot ? 0 : parent.level + 1,
        isBranchMounted: false,
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

    nodeState.r.vm = new (NoodelNode as any)(nodeState, noodel);
    parseAndApplyNodeOptions(noodel, def.options, nodeState);

    for (let i = 0; i < def.children.length; i++) {
        nodeState.children.push(buildNodeView(noodel, def.children[i], i, nodeState, i === activeChildIndex, 0));
    }

    return nodeState;
}