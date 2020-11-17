import NoodelState from 'src/types/NoodelState';
import NodeState from 'src/types/NodeState';
import { getFocalPositionY, getFocalPositionX } from './getters';

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
export function findCurrentTrunkOffset(noodel: NoodelState): number {

    if (!noodel.applyTrunkMove) return noodel.trunkOffset;

    let orientation = noodel.options.orientation;
    let canvasRect = noodel.r.canvasEl.getBoundingClientRect();
    let trunkRect = noodel.r.trunkEl.getBoundingClientRect();

    if (orientation === 'ltr') {
        return getFocalPositionX(noodel) - (trunkRect.left - canvasRect.left);
    }
    else if (orientation === 'rtl') {
        return getFocalPositionX(noodel) - (canvasRect.right - trunkRect.right);
    }
    else if (orientation === 'ttb') {
        return getFocalPositionY(noodel) - (trunkRect.top - canvasRect.top);
    }
    else if (orientation === 'btt') {
        return getFocalPositionY(noodel) - (canvasRect.bottom - trunkRect.bottom);
    }
}

/**
 * Finds the current rendered focal branch offset, taking into account the possibility
 * of it being in transition.
 */
export function findCurrentBranchOffset(noodel: NoodelState, parent: NodeState): number {

    if (!parent.applyBranchMove) return parent.branchOffset;

    let orientation = noodel.options.orientation;
    let branchDirection = noodel.options.branchDirection;
    let canvasRect = noodel.r.canvasEl.getBoundingClientRect();
    let focalBranchRect = parent.r.branchSliderEl.getBoundingClientRect();

    if (orientation === 'ltr' || orientation === 'rtl') {
        if (branchDirection === 'normal') {
            return getFocalPositionY(noodel) - (focalBranchRect.top - canvasRect.top);
        }
        else if (branchDirection === 'reverse') {
            return getFocalPositionY(noodel) - (canvasRect.bottom - focalBranchRect.bottom);
        }
    }
    else if (orientation === 'ttb' || orientation === 'btt') {
        if (branchDirection === 'normal') {
            return getFocalPositionX(noodel) - (focalBranchRect.left - canvasRect.left);
        }
        else if (branchDirection === 'reverse') {
            return getFocalPositionX(noodel) - (canvasRect.right - focalBranchRect.right);
        }
    }
}