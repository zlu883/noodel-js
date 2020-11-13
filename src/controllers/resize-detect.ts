import NoodelState from 'src/types/NoodelState';
import NodeState from 'src/types/NodeState';
import ResizeSensor from "../util/ResizeSensor";
import { checkContentOverflow, updateBranchSize, updateNodeSize } from './noodel-align';

export function attachResizeSensor(noodel: NoodelState, node: NodeState) {

    if (!node.parent) return;
    if (node.r.resizeSensor) return;

    let useResizeDetection = typeof node.options.useResizeDetection === "boolean"
        ? node.options.useResizeDetection
        : noodel.options.useResizeDetection;

    if (useResizeDetection) {
        node.r.resizeSensor = new ResizeSensor(node.r.el, (size) => {
            if (!noodel.isMounted) { // skips the first callback before mount
                return;
            }

            updateNodeSize(noodel, node, size.height, size.width);
            checkContentOverflow(noodel, node);
        });
    }
}

export function detachResizeSensor(node: NodeState) {
    if (node.r.resizeSensor) node.r.resizeSensor.detach();
    node.r.resizeSensor = null;
}

export function attachBranchResizeSensor(noodel: NoodelState, parent: NodeState) {

    if (parent.children.length === 0) return;
    if (parent.r.branchResizeSensor) return;

    let useResizeDetection = typeof parent.options.useBranchResizeDetection === 'boolean' 
        ? parent.options.useBranchResizeDetection 
        : noodel.options.useResizeDetection;

    if (useResizeDetection) {
        parent.r.branchResizeSensor = new ResizeSensor(parent.r.branchSliderEl, (size) => {
            if (!noodel.isMounted) { // skips the first callback before mount
                return;
            }

            updateBranchSize(noodel, parent, size.height, size.width);
        });
    };
}

export function detachBranchResizeSensor(parent: NodeState) {
    if (parent.r.branchResizeSensor) parent.r.branchResizeSensor.detach();
    parent.r.branchResizeSensor = null;
}

export function attachCanvasResizeSensor(noodel: NoodelState) {
    new ResizeSensor(noodel.r.canvasEl, (size) => {
        noodel.containerWidth = size.width,
        noodel.containerHeight = size.height
    });
}