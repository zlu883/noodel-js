import NoodelState from '../types/NoodelState';
import NoodeState from '../types/NoodeState';
import { traverseDescendents } from './noodel-traverse';

export function generateNoodeId(noodel: NoodelState) {
    noodel.r.idCount++;
    return '_' + noodel.r.idCount.toString();
}

/**
 * Register a noode and all its descendents.
 */
export function registerNoodeSubtree(noodel: NoodelState, subtreeRoot: NoodeState) {
    traverseDescendents(subtreeRoot, desc => {
        noodel.r.idMap.set(desc.id, desc);
    }, true);
}

/**
 * Unregister a noode and all its descendents.
 */
export function unregisterNoodeSubtree(noodel: NoodelState, noode: NoodeState) {
    traverseDescendents(noode, (desc) => {
        noodel.r.idMap.delete(desc.id);
        // detach noodel state in view model, will be used in vm to check whether noode is deleted
        (desc.r.vm as any).noodelState = null;
    }, true);
}

export function findNoode(noodel: NoodelState, id: string): NoodeState {
    return noodel.r.idMap.get(id) || null;
}

export function isIdRegistered(noodel: NoodelState, id: string): boolean {
    return noodel.r.idMap.has(id);
}

export function changeNoodeId(noodel: NoodelState, oldId: string, newId: string) {
    let noode = noodel.r.idMap.get(oldId);

    noode.id = newId;
    noodel.r.idMap.delete(oldId);
    noodel.r.idMap.set(newId, noode);
}