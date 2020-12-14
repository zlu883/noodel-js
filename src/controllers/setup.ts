/* Module for initializing noodel and node state trees. */

import NodeDefinition from '../types/NodeDefinition';
import NoodelOptions from '../types/NoodelOptions';
import NodeState from '../types/NodeState';
import NoodelState from '../types/NoodelState';
import { jumpToHash } from './routing';
import { generateNodeId, registerNodeSubtree, isIdRegistered } from './identity';
import NoodelNode from '../main/NoodelNode';
import { reactive, markRaw } from 'vue';
import { parseContent } from './serialize';
import { parseAndApplyNodeOptions, parseAndApplyOptions } from './options';
import { throwError } from './util';

export function createNoodelState(root: NodeDefinition, options: NoodelOptions): NoodelState {

    let noodelState: NoodelState = reactive({
        r: markRaw({
            containerEl: null,
            vueInstance: null,
            idCount: -1,
            idMap: new Map([]),
            throttleMap: new Map([]),
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
        trunkPanOffset: 0,
        branchPanOffset: 0,
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
            showLimitIndicators: true,
            showChildIndicators: true,
            orientation: "ltr",
            branchDirection: "normal",
            focalOffsetTrunk: (s) => s / 2,
            focalOffsetBranch: (s) => s / 2,
            anchorOffsetTrunk: (s) => s / 2,
            anchorOffsetBranch: (s) => s / 2
        },
    });

    let rootNode = createNodeState(noodelState, root, 0, null, true, 0);

    noodelState.root = rootNode;
    noodelState.focalParent = rootNode;

    registerNodeSubtree(noodelState, rootNode);
    parseAndApplyOptions(options, noodelState);

    if (noodelState.options.useRouting) {
        jumpToHash(noodelState); // this will cause extra focal change event if there's jump
    }

    return noodelState;
}

/**
 * Recursively build the state tree for new nodes.
 */
export function createNodeState(noodel: NoodelState, def: NodeDefinition, index: number, parent: NodeState, isActive: boolean, branchRelativeOffset: number): NodeState {

    let isRoot = parent === null;
    let children = def.children || [];
    let classNames = def.classNames || {};
    let styles = def.styles || {};
    let options = def.options || {};
    let id = def.id;

    if (id) {
        if (isIdRegistered(noodel, id)) {
            throwError("Duplicate ID detected for new node: " + id);
        }
    }
    else {
        id = generateNodeId(noodel);
    }

    // parse and validate active child index
    let activeChildIndex = children.length > 0 ? 0 : null;

    for (let i = 0; i < children.length; i++) {
        if (children[i].isActive) {
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
            vm: null,
        }),
        index: index,
        level: isRoot ? 0 : parent.level + 1,
        isBranchMounted: false,
        isBranchTransparent: true, // initialize to transparent state for capturing size
        isFocalParent: isRoot, // only initialze root as focal parent
        isActive: isActive,
        isActiveLineage: isRoot || (isActive && parent.isActiveLineage),

        isInInspectMode: false,

        branchOffset: 0,
        applyBranchMove: true,
        branchTransitOffset: 0,

        branchRelativeOffset: branchRelativeOffset,
        trunkRelativeOffset: isRoot ? 0 : parent.trunkRelativeOffset + parent.branchSize,
        
        size: 0,
        branchSize: 0,
        
        parent: parent as any,
        id: id,
        children: [],
        content: parseContent(def.content) || null,
        branchContent: parseContent(def.branchContent) || null,
        classNames: {
            ...classNames
        },
        styles: {
            ...styles
        },
        activeChildIndex: activeChildIndex,
        options: {
            showChildIndicator: null,
            focalAnchorBranch: null,
            focalAnchorTrunk: null
        },

        childrenExiting: [],
        c: false,
        d: false,
        t: false,
        e: false
    });

    nodeState.r.vm = new (NoodelNode as any)(nodeState, noodel);
    parseAndApplyNodeOptions(noodel, options, nodeState);

    for (let i = 0; i < children.length; i++) {
        nodeState.children.push(createNodeState(noodel, children[i], i, nodeState, i === activeChildIndex, 0));
    }

    return nodeState;
}