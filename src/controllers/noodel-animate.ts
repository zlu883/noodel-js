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
    let orientation = noodel.options.orientation;
    let canvasRect = noodel.canvasEl.getBoundingClientRect();
    let trunkRect = noodel.trunkEl.getBoundingClientRect();

    if (orientation === 'ltr') {
        return trunkRect.left - canvasRect.left - getFocalWidth(noodel);
    }
    else if (orientation === 'rtl') {
        return canvasRect.right - trunkRect.right - getFocalWidth(noodel);
    }
    else if (orientation === 'ttb') {
        return trunkRect.top - canvasRect.top - getFocalHeight(noodel);
    }
    else if (orientation === 'btt') {
        return canvasRect.bottom - trunkRect.bottom - getFocalHeight(noodel);
    }
}

/**
 * Finds the current rendered focal branch offset, taking into account the possibility
 * of it being in transition.
 */
export function findCurrentBranchOffset(noodel: NoodelState, parent: NoodeState): number {
    let orientation = noodel.options.orientation;
    let branchDirection = noodel.options.branchDirection;
    let canvasRect = noodel.canvasEl.getBoundingClientRect();
    let focalBranchRect = parent.branchEl.getBoundingClientRect();

    if (orientation === 'ltr' || orientation === 'rtl') {
        if (branchDirection === 'normal') {
            return focalBranchRect.top - canvasRect.top - getFocalHeight(noodel);
        }
        else if (branchDirection === 'reversed') {
            return canvasRect.bottom - focalBranchRect.bottom - getFocalHeight(noodel);
        }
    }
    else if (orientation === 'ttb' || orientation === 'btt') {
        if (branchDirection === 'normal') {
            return focalBranchRect.left - canvasRect.left - getFocalWidth(noodel);
        }
        else if (branchDirection === 'reversed') {
            return canvasRect.right - focalBranchRect.right - getFocalWidth(noodel);
        }
    }
}