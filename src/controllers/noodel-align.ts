import NoodeView from '@/model/NoodeView';
import NoodelView from '@/model/NoodelView';

/**
 * Handler for when a branch changes its size (on trunk axis), to align the trunk if necessary.
 * @param parent parent noode of the branch
 * @param newSize new branch size
 * @param level level of the branch
 */
export function alignTrunkOnBranchSizeChange(parent: NoodeView, newSize: number, level: number, noodel: NoodelView) {
    let diff = newSize - parent.branchSize;

    if (Math.abs(diff) < 0.01) return; // diff too small for alignment

    parent.branchSize = newSize;

    if (parent.isFocalParent) {
        noodel.trunkOffset -= diff / 2;
        noodel.trunkOffsetOrigin -= diff / 2;
        noodel.trunkRelativeOffset += diff / 2;
    }
    else if (parent.isChildrenVisible && level < noodel.focalLevel) {
        noodel.trunkOffset -= diff;
        noodel.trunkOffsetOrigin -= diff;
    }
}

/**
 * Handler for when a noode changes its size (on branch axis), to align the branch if necessary
 * @param noode noode with size change
 * @param newSize new noode size
 * @param index child index of the noode
 */
export function alignBranchOnNoodeSizeChange(noode: NoodeView, newSize: number, index: number) {
    const parent = noode.parent;
    
    let diff = newSize - noode.size;  

    if (Math.abs(diff) < 0.01) return; // diff too small to need re-render

    noode.size = newSize;
    
    if (index === noode.parent.activeChildIndex) {
        parent.branchOffset -= diff / 2;
        parent.branchOffsetOrigin -= diff / 2;
        parent.branchRelativeOffset += diff / 2;
    }
    else if (index < parent.activeChildIndex) {
        parent.branchOffset -= diff;
        parent.branchOffsetOrigin -= diff;
    }
}