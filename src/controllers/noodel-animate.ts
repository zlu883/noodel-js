import NoodelState from 'src/types/NoodelState';
import NodeState from 'src/types/NodeState';
import { getActualOffsetBranch, getActualOffsetTrunk } from './getters';

/**
 * Forces a layout reflow on browsers by doing a computed property access.
 * Some browsers have an issue with transform/opacity transitions 
 * such that the rendering will glitch if the property is changed midway
 * during an ongoing transition. Forcing a reflow when a new transition is
 * expected eliminates the problem.
 * 
 * Also useful when you need to force a layout refresh after changing some styles
 * in order to perform further changes.
 */
export function forceReflow() {
    document.body.getBoundingClientRect();
}

/**
 * Finds the current rendered trunk offset, taking into account the possibility
 * of it being in transition.
 */
export function findRenderedTrunkOffset(noodel: NoodelState): number {

    if (!noodel.applyTrunkMove) return getActualOffsetTrunk(noodel);

    let orientation = noodel.options.orientation;
    let canvasRect = noodel.r.canvasEl.getBoundingClientRect();
    let trunkRect = noodel.r.trunkEl.getBoundingClientRect();

    if (orientation === 'ltr') {
        return trunkRect.left - canvasRect.left;
    }
    else if (orientation === 'rtl') {
        return canvasRect.right - trunkRect.right;
    }
    else if (orientation === 'ttb') {
        return trunkRect.top - canvasRect.top;
    }
    else if (orientation === 'btt') {
        return canvasRect.bottom - trunkRect.bottom;
    }
}

/**
 * Finds the current rendered focal branch offset, taking into account the possibility
 * of it being in transition.
 */
export function findRenderedBranchOffset(noodel: NoodelState, parent: NodeState): number {

    if (!parent.applyBranchMove) return getActualOffsetBranch(noodel, parent);

    let orientation = noodel.options.orientation;
    let branchDirection = noodel.options.branchDirection;
    let canvasRect = noodel.r.canvasEl.getBoundingClientRect();
    let branchSliderRect = parent.r.branchSliderEl.getBoundingClientRect();

    if (orientation === 'ltr' || orientation === 'rtl') {
        if (branchDirection === 'normal') {
            return branchSliderRect.top - canvasRect.top;
        }
        else if (branchDirection === 'reverse') {
            return canvasRect.bottom - branchSliderRect.bottom;
        }
    }
    else if (orientation === 'ttb' || orientation === 'btt') {
        if (branchDirection === 'normal') {
            return branchSliderRect.left - canvasRect.left;
        }
        else if (branchDirection === 'reverse') {
            return canvasRect.right - branchSliderRect.right;
        }
    }
}