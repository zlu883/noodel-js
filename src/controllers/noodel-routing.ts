import NoodelView from '@/model/NoodelView';
import IdRegister from '@/main/IdRegister';
import { jumpToNoode } from './noodel-navigate';

export function setupRouting(noodel: NoodelView, idReg: IdRegister) {

    if (noodel.onHashChanged) return;

    noodel.onHashChanged = () => {
        let hash = window.location.hash;

        if (hash) {
            let target = idReg.findNoode(hash.substr(1));

            if (target && target.parent) {
                jumpToNoode(noodel, target);
            }
        } 
    };

    window.addEventListener("hashchange", noodel.onHashChanged);
}

export function unsetRouting(noodel: NoodelView) {

    if(!noodel.onHashChanged) return;

    window.removeEventListener("hashchange", noodel.onHashChanged);
    noodel.onHashChanged = undefined;
}

/**
 * Replaces the hash fragment without triggering hashchange event.
 */
export function replaceHash(newHash: string) {

    window.history.replaceState(null, '', window.location.href.split("#")[0] + '#' + newHash);
}

/**
 * Changes the hash fragment and triggers hashchange event.
 */
export function changeHash(newHash: string) {

    window.location.hash = newHash;
}