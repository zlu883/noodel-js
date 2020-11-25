/* Module for parsing and applying noodel and node options. */

import { nextTick } from 'vue';
import NodeOptions from '../types/NodeOptions';
import NodeState from '../types/NodeState';
import NoodelOptions from '../types/NoodelOptions';
import NoodelState from '../types/NoodelState';
import { adjustTrunkMoveOffset, adjustBranchMoveOffset, resetAlignment } from './alignment';
import { isPanningTrunk, isPanningBranch } from './getters';
import { finalizePan } from './pan';
import { attachBranchResizeSensor, attachResizeSensor, detachBranchResizeSensor, detachResizeSensor } from './resize-sensor';
import { setupRouting, unsetRouting } from './routing';
import { disableBranchTransition, forceReflow, enableBranchTransition } from './transition';
import { traverseDescendents } from './traverse';

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
            traverseDescendents(noodel.root, node => disableBranchTransition(noodel, node), true);
            nextTick(() => {
                forceReflow();
                traverseDescendents(noodel.root, node => enableBranchTransition(node), true)
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