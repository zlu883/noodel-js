import NodeDefinition from '../types/NodeDefinition';
import NoodelOptions from '../types/NoodelOptions';
import NodeState from '../types/NodeState';
import NoodelState from '../types/NoodelState';
import { showActiveSubtree } from './noodel-navigate';
import { jumpToHash, setupRouting, unsetRouting } from './noodel-routing';
import NodeOptions from '../types/NodeOptions';
import { generateNodeId, registerNodeSubtree, isIdRegistered } from './id-register';
import { finalizePan } from './noodel-pan';
import { adjustBranchMoveOffset, adjustTrunkMoveOffset, resetAlignment, updateCanvasSize } from './noodel-align';
import { traverseDescendents } from './noodel-traverse';
import { attachBranchResizeSensor, attachCanvasResizeSensor, attachResizeSensor, detachBranchResizeSensor, detachResizeSensor } from './resize-detect';
import NoodelNode from '../main/NoodelNode';
import { reactive, markRaw, nextTick } from 'vue';
import ComponentContent from '../types/ComponentContent';
import { isPanningBranch, isPanningTrunk } from './getters';
import { disableBranchMove, enableBranchMove, forceReflow } from './noodel-animate';

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
            lastPanDistanceX: 0,
            lastPanDistanceY: 0,
            panAxis: null,
            swipeVelocityBuffer: [],
            isShiftKeyPressed: false,
            limitIndicatorTimeout: null,
            pointerUpSrcNode: null,
            panStartFocalNode: null,
            canvasEl: null,
            trunkEl: null,
            hammerJsInstance: null,
        }),

        isMounted: false,

        root: null,
        focalParent: null,
        focalLevel: 1,

        trunkOffset: 0,
        applyTrunkMove: true,
        trunkMoveOffset: 0,
        branchMoveOffset: 0,
        trunkTransitOffset: 0,

        branchStartReached: false,
        branchEndReached: false,
        trunkStartReached: false,
        trunkEndReached: false,

        isInInspectMode: false,

        canvasSizeBranch: 0,
        canvasSizeTrunk: 0,

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
            showLimitIndicators: true,
            showChildIndicators: true,
            orientation: "ltr",
            branchDirection: "normal",
            focalPositionTrunk: (w) => w / 2,
            focalPositionBranch: (h) => h / 2,
            focalAnchorTrunk: (s) => s / 2,
            focalAnchorBranch: (s) => s / 2
        },
    });

    let rootNode = buildNodeState(noodelState, root, 0, null, true, 0);

    noodelState.root = rootNode;
    noodelState.focalParent = rootNode;

    registerNodeSubtree(noodelState, rootNode);
    parseAndApplyOptions(options, noodelState);
    showActiveSubtree(rootNode, noodelState.options.visibleSubtreeDepth);

    if (noodelState.options.useRouting) {
        jumpToHash(noodelState); // this will cause extra focal change event if there's jump
    }

    return noodelState;
}

/**
 * Recursively parses the given HTML element into a tree of noodel nodes. 
 */
export function parseHTMLToNode(el: Element): NodeDefinition {

    let content = '';
    let branchContent = '';
    let children: NodeDefinition[] = [];

    for (let i = 0; i < el.childNodes.length; i++) {
        const node = el.childNodes[i];

        if (node.nodeType === Node.TEXT_NODE) {
            content += node.textContent; // Depends on css white-space property for ignoring white spaces
        }
        else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.nodeName === "DIV") {
                let classNames = (node as Element).className.split(' ');

                if (classNames.some(c => c === 'node')) {
                    children.push(parseHTMLToNode(node as Element));
                }
                else if (classNames.some(c => c === 'branch-content')) {
                    branchContent = (node as Element).innerHTML;
                }
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
        branchContent: branchContent || null,
        isActive: 'active' in attributes,
        children: children,
        classNames: {
            node: attributes.classNode,
            contentBox: attributes.classContentBox,
            childIndicator: attributes.classChildIndicator,
            branch: attributes.classBranch,
            branchContentBox: attributes.classBranchContentBox,
            branchSlider: attributes.classBranchSlider,
        },
        styles: {
            node: attributes.styleNode,
            contentBox: attributes.styleContentBox,
            childIndicator: attributes.styleChildIndicator,
            branch: attributes.styleBranch,
            branchContentBox: attributes.styleBranchContentBox,
            branchSlider: attributes.styleBranchSlider,
        },
        options: {
            useResizeDetection: attributes.useResizeDetection === 'true' ? true : attributes.useResizeDetection === 'false' ? false : null,
            useBranchResizeDetection: attributes.useBranchResizeDetection === 'true' ? true : attributes.useBranchResizeDetection === 'false' ? false : null,
            showChildIndicator: attributes.showChildIndicator === 'true' ? true : attributes.showChildIndicator === 'false' ? false : null,
        }
    };
}

export function setupCanvasEl(noodel: NoodelState) {

    let rect = noodel.r.canvasEl.getBoundingClientRect();

    updateCanvasSize(noodel, rect.height, rect.width);
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

    if (!options.useSwipeNavigation) {
        finalizePan(noodel);
    }

    if (options.focalAnchorTrunk && isPanningTrunk(noodel)) {
        adjustTrunkMoveOffset(noodel);
    }

    if (options.focalAnchorBranch && isPanningBranch(noodel)) {
        adjustBranchMoveOffset(noodel);
    }

    if (noodel.options.useRouting) {
        setupRouting(noodel);
    }
    else {
        unsetRouting(noodel);
    }

    if (noodel.isMounted) {
        let newOrientation = noodel.options.orientation;
        let newBranchDirection = noodel.options.branchDirection;

        if (newOrientation !== oldOrientation) {
            resetAlignment(noodel);
        }
        else if (newBranchDirection !== oldBranchDirection) {
            // prevent transition
            traverseDescendents(noodel.root, node => disableBranchMove(noodel, node), true);
            nextTick(() => {
                forceReflow();
                traverseDescendents(noodel.root, node => enableBranchMove(node), true)
            });
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

/**
 * Recursively build the state tree for new nodes.
 */
export function buildNodeState(noodel: NoodelState, def: NodeDefinition, index: number, parent: NodeState, isActive: boolean, branchRelativeOffset: number): NodeState {

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
            contentBoxEl: null,
            el: null,
            branchEl: null,
            branchSliderEl: null,
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
        applyBranchMove: true,
        branchTransitOffset: 0,

        branchRelativeOffset: branchRelativeOffset,
        trunkRelativeOffset: isRoot ? 0 : parent.trunkRelativeOffset + parent.branchSize,
        
        size: 0,
        branchSize: 0,
        
        parent: parent as any,
        id: newId,
        children: [],
        content: parseContent(def.content) || null,
        branchContent: parseContent(def.branchContent) || null,
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
            showChildIndicator: null,
        },
    });

    nodeState.r.vm = new (NoodelNode as any)(nodeState, noodel);
    parseAndApplyNodeOptions(noodel, def.options, nodeState);

    for (let i = 0; i < def.children.length; i++) {
        nodeState.children.push(buildNodeState(noodel, def.children[i], i, nodeState, i === activeChildIndex, 0));
    }

    return nodeState;
}

export function parseContent(content: string | ComponentContent): string | ComponentContent {
    if (!content) return content;
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
        return {
            component: typeof content.component === 'object' ? markRaw(content.component) : content.component,
            props: {...content.props},
            eventListeners: {...content.eventListeners}
        }
    }
}