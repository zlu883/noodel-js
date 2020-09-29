import NoodelState from '../types/NoodelState';
import { doJumpNavigation } from './noodel-navigate';
import { findNoodeViewState } from './id-register';
import { getActiveChild } from '../util/getters';

export function setupRouting(noodel: NoodelState) {

    if (noodel.onHashChanged) return;

    noodel.onHashChanged = () => {
        let hash = window.location.hash;

        if (hash) {
            let target = findNoodeViewState(noodel, hash.substr(1));

            if (target && target.parent) {
                doJumpNavigation(noodel, target);
            }
        } 
    };

    window.addEventListener("hashchange", noodel.onHashChanged);
}

export function syncHashToFocalNoode(noodel: NoodelState) {
    if (!noodel.options.useRouting) return;

    let focalNoode = getActiveChild(noodel.focalParent);

    if (focalNoode) {
        replaceHash('#' + focalNoode.id);
    }
    else {
        replaceHash('');
    }
}

export function unsetRouting(noodel: NoodelState) {

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