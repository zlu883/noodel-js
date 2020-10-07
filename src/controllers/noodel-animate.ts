import NoodelState from 'src/types/NoodelState';
import NoodeState from 'src/types/NoodeState';
import { getFocalHeight, getFocalWidth } from './getters';

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
    let canvasRect = noodel.canvasEl.getBoundingClientRect();
    let trunkRect = noodel.trunkEl.getBoundingClientRect();

    if (orientation === 'ltr') {
        return getFocalWidth(noodel) - (trunkRect.left - canvasRect.left);
    }
    else if (orientation === 'rtl') {
        return getFocalWidth(noodel) - (canvasRect.right - trunkRect.right);
    }
    else if (orientation === 'ttb') {
        return getFocalHeight(noodel) - (trunkRect.top - canvasRect.top);
    }
    else if (orientation === 'btt') {
        return getFocalHeight(noodel) - (canvasRect.bottom - trunkRect.bottom);
    }
}

/**
 * Finds the current rendered focal branch offset, taking into account the possibility
 * of it being in transition.
 */
export function findCurrentBranchOffset(noodel: NoodelState, parent: NoodeState): number {

    if (!parent.applyBranchMove) return parent.branchOffset;

    let orientation = noodel.options.orientation;
    let branchDirection = noodel.options.branchDirection;
    let canvasRect = noodel.canvasEl.getBoundingClientRect();
    let focalBranchRect = parent.branchEl.getBoundingClientRect();

    if (orientation === 'ltr' || orientation === 'rtl') {
        if (branchDirection === 'normal') {
            return getFocalHeight(noodel) - (focalBranchRect.top - canvasRect.top);
        }
        else if (branchDirection === 'reversed') {
            return getFocalHeight(noodel) - (canvasRect.bottom - focalBranchRect.bottom);
        }
    }
    else if (orientation === 'ttb' || orientation === 'btt') {
        if (branchDirection === 'normal') {
            return getFocalWidth(noodel) - (focalBranchRect.left - canvasRect.left);
        }
        else if (branchDirection === 'reversed') {
            return getFocalWidth(noodel) - (canvasRect.right - focalBranchRect.right);
        }
    }
}