import NoodelView from '../types/NoodelView';
import { doJumpNavigation } from './noodel-navigate';
import { findNoodeView } from './id-register';
import { getActiveChild } from '../util/getters';

export function setupRouting(noodel: NoodelView) {

    if (noodel.onHashChanged) return;

    noodel.onHashChanged = () => {
        let hash = window.location.hash;

        if (hash) {
            let target = findNoodeView(noodel, hash.substr(1));

            if (target && target.parent) {
                doJumpNavigation(noodel, target);
            }
        } 
    };

    window.addEventListener("hashchange", noodel.onHashChanged);
}

export function syncHashToFocalNoode(noodel: NoodelView) {
    if (!noodel.options.useRouting) return;

    let focalNoode = getActiveChild(noodel.focalParent);

    if (focalNoode) {
        replaceHash('#' + focalNoode.id);
    }
    else {
        replaceHash('');
    }
}

export function unsetRouting(noodel: NoodelView) {

    if(!noodel.onHashChanged) return;

    window.removeEventListener("hashchange", noodel.onHashChanged);
    noodel.onHashChanged = null;
}

/**
 * Replaces the hash fragment without triggering hashchange event.
 */
function replaceHash(newHash: string) {

    window.history.replaceState(null, '', window.location.href.split("#")[0] + newHash);
}