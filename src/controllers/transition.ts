/* Module for functions associated with managing transitions. */

import NoodelState from 'src/types/NoodelState';
import NodeState from 'src/types/NodeState';
import { getActualOffsetBranch, getActualOffsetTrunk } from './getters';

/**
 * Calculates the difference between the expected trunk offset
 * and its current rendered offset (may be in transition)
 * and set it as the transit offset.
 */
function applyTrunkTransitOffset(noodel: NoodelState) {
    let orientation = noodel.options.orientation;
    let canvasRect = noodel.r.canvasEl.getBoundingClientRect();
    let trunkRect = noodel.r.trunkEl.getBoundingClientRect();
    let renderedOffset;

    if (orientation === 'ltr') {
        renderedOffset = trunkRect.left - canvasRect.left;
    }
    else if (orientation === 'rtl') {
        renderedOffset = canvasRect.right - trunkRect.right;
    }
    else if (orientation === 'ttb') {
        renderedOffset = trunkRect.top - canvasRect.top;
    }
    else if (orientation === 'btt') {
        renderedOffset = canvasRect.bottom - trunkRect.bottom;
    }

    noodel.trunkTransitOffset = renderedOffset - getActualOffsetTrunk(noodel);
}

/**
 * Calculates the difference between the expected branch offset
 * and its current rendered offset (may be in transition)
 * and set it as the transit offset.
 */
function applyBranchTransitOffset(noodel: NoodelState, parent: NodeState) {
    if (!parent.isBranchVisible) return;

    let orientation = noodel.options.orientation;
    let branchDirection = noodel.options.branchDirection;
    let canvasRect = noodel.r.canvasEl.getBoundingClientRect();
    let branchSliderRect = parent.r.branchSliderEl.getBoundingClientRect();
    let renderedOffset;

    if (orientation === 'ltr' || orientation === 'rtl') {
        if (branchDirection === 'normal') {
            renderedOffset = branchSliderRect.top - canvasRect.top;
        }
        else if (branchDirection === 'reverse') {
            renderedOffset = canvasRect.bottom - branchSliderRect.bottom;
        }
    }
    else if (orientation === 'ttb' || orientation === 'btt') {
        if (branchDirection === 'normal') {
            renderedOffset = branchSliderRect.left - canvasRect.left;
        }
        else if (branchDirection === 'reverse') {
            renderedOffset = canvasRect.right - branchSliderRect.right;
        }
    }

    parent.branchTransitOffset = renderedOffset - getActualOffsetBranch(noodel, parent);
}

/**
 * Enable trunk transition by attaching the move class. 
 */
export function enableTrunkTransition(noodel: NoodelState) {
    if (noodel.applyTrunkMove) return;
    noodel.trunkTransitOffset = 0;
    noodel.applyTrunkMove = true;
}

/**
 * Disable trunk transition by detaching the move class. 
 * Can optionally apply transit offset.
 */
export function disableTrunkTransition(noodel: NoodelState, applyTransit: boolean = false) {
    if (!noodel.applyTrunkMove) return;
    if (applyTransit) applyTrunkTransitOffset(noodel);
    noodel.applyTrunkMove = false;
}

/**
 * Enable branch transition by attaching the move class. 
 */
export function enableBranchTransition(parent: NodeState) {
    if (parent.applyBranchMove) return;
    parent.branchTransitOffset = 0;
    parent.applyBranchMove = true;
}

/**
 * Disable branch transition by detaching the move class. 
 */
export function disableBranchTransition(noodel: NoodelState, parent: NodeState, applyTransit: boolean = false) {
    if (!parent.applyBranchMove) return;
    if (applyTransit) applyBranchTransitOffset(noodel, parent);
    parent.applyBranchMove = false;
}

/**
 * Forces a layout reflow on browsers by doing a computed property access.
 * Some browsers have an issue with transform/opacity transitions 
 * such that the rendering will glitch if the property is changed midway
 * during an ongoing transition. Forcing a reflow when a new transition is
 * expected eliminates the problem.
 * 
 * Also useful when you need to force the browser to apply style changes
 * after updates in order to prepare for further changes.
 */
export function forceReflow() {
    document.body.getBoundingClientRect();
}