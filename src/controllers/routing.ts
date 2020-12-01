/* Module for handing URL hash routing behaviour. */

import NoodelState from '../types/NoodelState';
import { jumpTo } from './navigate';
import { findNode } from './identity';
import { getActiveChild } from './getters';

/**
 * Replaces the hash fragment without triggering hashchange event.
 */
function replaceHash(newHash: string) {
    window.history.replaceState(null, '', window.location.href.split("#")[0] + newHash);
}

export function setupRouting(noodel: NoodelState) {
    if (noodel.r.onHashChanged) return;

    noodel.r.onHashChanged = () => {
        jumpToHash(noodel);
    };

    window.addEventListener("hashchange", noodel.r.onHashChanged);
}

export function jumpToHash(noodel: NoodelState) {
    let hash = window.location.hash;

    if (hash) {
        let target = findNode(noodel, hash.substr(1));

        if (target && target.parent) {
            jumpTo(noodel, target);
        }
    } 
}

export function syncHashToFocalNode(noodel: NoodelState) {
    if (!noodel.options.useRouting) return;

    let focalNode = getActiveChild(noodel.focalParent);

    if (focalNode) {
        replaceHash('#' + focalNode.id);
    }
    else {
        replaceHash('');
    }
}

export function unsetRouting(noodel: NoodelState) {
    let onHashChanged = noodel.r.onHashChanged;

    if(!onHashChanged) return;

    window.removeEventListener("hashchange", onHashChanged);
    noodel.r.onHashChanged = null;
}