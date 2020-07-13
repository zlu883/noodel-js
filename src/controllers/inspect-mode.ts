import NoodelView from '@/types/NoodelView';
import { getActiveChild } from '@/util/getters';

export function enterInspectMode(noodel: NoodelView) {
    noodel.isInInspectMode = true;
    // touch-action: auto on focal noode under inspect mode
    // interferes with Hammer's recognizers, so they must be disabled first
    noodel.hammerJsInstance.get('pan').set({enable: false});
    noodel.hammerJsInstance.get('swipe').set({enable: false});
    getActiveChild(noodel.focalParent).isInInspectMode = true;
}

export function exitInspectMode(noodel: NoodelView) {
    noodel.isInInspectMode = false;
    noodel.hammerJsInstance.get('pan').set({enable: true});
    noodel.hammerJsInstance.get('swipe').set({enable: true});
    getActiveChild(noodel.focalParent).isInInspectMode = false;

    // unset selection
    const sel = window.getSelection ? window.getSelection() : document.getSelection();

    if (sel) {
        if (sel.removeAllRanges) {
            sel.removeAllRanges();
        } 
        else if (sel.empty) {
            sel.empty();
        }
    }
}