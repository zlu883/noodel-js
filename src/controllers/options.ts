/* Module for parsing and applying noodel and node options. */

import { nextTick } from 'vue';
import NodeOptions from '../types/NodeOptions';
import NodeState from '../types/NodeState';
import NoodelOptions from '../types/NoodelOptions';
import NoodelState from '../types/NoodelState';
import { adjustTrunkPanOffset, adjustBranchPanOffset, resetAlignment, handleFocalShiftTrunk, handleFocalShiftBranch } from './alignment';
import { isPanningTrunk, isPanningBranch, getOrientation, getBranchDirection, getFocalOffsetTrunk, getFocalOffsetBranch } from './getters';
import { finalizePan } from './pan';
import { setupRouting, unsetRouting } from './routing';
import { disableBranchTransition, enableBranchTransition } from './transition';
import { traverseDescendants } from './traverse';
import { forceReflow } from './util';

export function parseAndApplyOptions(options: NoodelOptions, noodel: NoodelState) {

    if (!noodel.isMounted) {
        noodel.options = {
            ...noodel.options,
            ...options
        }

        if (noodel.options.useRouting) {
            setupRouting(noodel);
        }
        else {
            unsetRouting(noodel);
        }
    }
    else {
        let oldFocalOffsetTrunk = getFocalOffsetTrunk(noodel);
        let oldFocalOffsetBranch = getFocalOffsetBranch(noodel, noodel.focalParent);
        let oldOrientation = getOrientation(noodel);
        let oldBranchDirection = getBranchDirection(noodel);

        noodel.options = {
            ...noodel.options,
            ...options
        }

        if (!noodel.options.useSwipeNavigation) {
            finalizePan(noodel);
        }

        if (options.anchorOffsetTrunk && isPanningTrunk(noodel)) {
            adjustTrunkPanOffset(noodel);
        }

        if (options.anchorOffsetBranch && isPanningBranch(noodel)) {
            adjustBranchPanOffset(noodel);
        }

        handleFocalShiftTrunk(noodel, oldFocalOffsetTrunk);
        handleFocalShiftBranch(noodel, noodel.focalParent, oldFocalOffsetBranch);

        if (noodel.options.useRouting) {
            setupRouting(noodel);
        }
        else {
            unsetRouting(noodel);
        }

        let newOrientation = getOrientation(noodel);
        let newBranchDirection = getBranchDirection(noodel);

        if (newOrientation !== oldOrientation) {
            resetAlignment(noodel);
        }
        else if (newBranchDirection !== oldBranchDirection) {
            // prevent transition
            traverseDescendants(noodel.root, node => disableBranchTransition(noodel, node), true);
            nextTick(() => {
                forceReflow();
                traverseDescendants(noodel.root, node => enableBranchTransition(node), true)
            });
        }
    }
}

export function parseAndApplyNodeOptions(noodel: NoodelState, options: NodeOptions, node: NodeState) {

    if (!noodel.isMounted) {
        node.options = {
            ...node.options,
            ...options
        };
    }
    else {
        let oldFocalOffsetTrunk = getFocalOffsetTrunk(noodel);
        let oldFocalOffsetBranch = getFocalOffsetBranch(noodel, noodel.focalParent);

        node.options = {
            ...node.options,
            ...options
        };

        if (node.isFocalParent) {
            if (options.anchorOffsetTrunk && isPanningTrunk(noodel)) {
                adjustTrunkPanOffset(noodel);
            }

            handleFocalShiftTrunk(noodel, oldFocalOffsetTrunk);
        }

        if (node.parent && node.parent.isFocalParent) {
            if (options.anchorOffsetBranch && isPanningBranch(noodel)) {
                adjustBranchPanOffset(noodel);
            }

            handleFocalShiftBranch(noodel, node.parent, oldFocalOffsetBranch);
        }
    }
}