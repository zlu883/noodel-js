import NoodelState from 'src/types/NoodelState';
import NoodeState from 'src/types/NoodeState';
import ResizeSensor from "../util/ResizeSensor";
import { checkContentOverflow, updateBranchSize, updateNoodeSize } from './noodel-align';

export function attachResizeSensor(noodel: NoodelState, noode: NoodeState) {

    if (!noode.parent) return;
    if (noode.resizeSensor) return;

    let useResizeDetection = typeof noode.options.useResizeDetection === "boolean"
        ? noode.options.useResizeDetection
        : noodel.options.useResizeDetection;

    if (useResizeDetection) {
        noode.resizeSensor = new ResizeSensor(noode.boxEl, (size) => {
            if (!noodel.isMounted) { // skips the first callback before mount
                return;
            }

            updateNoodeSize(noodel, noode, size.height, size.width);
            checkContentOverflow(noodel, noode);
        });
    }
}

export function detachResizeSensor(noode: NoodeState) {
    if (noode.resizeSensor) noode.resizeSensor.detach();
    noode.resizeSensor = null;
}

export function attachBranchResizeSensor(noodel: NoodelState, parent: NoodeState) {

    if (parent.children.length === 0) return;
    if (parent.branchResizeSensor) return;

    let useResizeDetection = typeof parent.options.useBranchResizeDetection === 'boolean' 
        ? parent.options.useBranchResizeDetection 
        : noodel.options.useResizeDetection;

    if (useResizeDetection) {
        parent.branchResizeSensor = new ResizeSensor(parent.branchBoxEl, (size) => {
            if (!noodel.isMounted) { // skips the first callback before mount
                return;
            }

            updateBranchSize(noodel, parent, size.height, size.width);
        });
    };
}

export function detachBranchResizeSensor(parent: NoodeState) {
    if (parent.branchResizeSensor) parent.branchResizeSensor.detach();
    parent.branchResizeSensor = null;
}

export function attachCanvasResizeSensor(noodel: NoodelState) {
    new ResizeSensor(noodel.canvasEl, (size) => {
        noodel.containerWidth = size.width,
        noodel.containerHeight = size.height
    });
}