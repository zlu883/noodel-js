import NoodelState from '../types/NoodelState';
import NoodeState from '../types/NoodeState';
import { traverseDescendents } from './noodel-traverse';
import Noode from '../main/Noode';

export function generateNoodeId(noodel: NoodelState) {
    noodel.idCount++;
    return '_' + noodel.idCount.toString();
}

/**
 * Register a noode and all its descendents.
 */
export function registerNoodeSubtree(noodel: NoodelState, subtreeRoot: NoodeState) {
    traverseDescendents(subtreeRoot, (desc) => {
        noodel.idMap.set(desc.id, {viewState: desc, viewModel: new (Noode as any)(desc, noodel, desc["data"])});
        // removes the custom data reference to avoid it being tracked by Vue
        delete desc["data"];
    }, true);
}

/**
 * Unregister a noode and all its descendents.
 */
export function unregisterNoodeSubtree(noodel: NoodelState, noode: NoodeState) {
    traverseDescendents(noode, (desc) => {
        noodel.idMap.delete(desc.id);
    }, true);
}

export function findNoodeViewState(noodel: NoodelState, id: string): NoodeState {
    let noode = noodel.idMap.get(id);

    return noode ? noode.viewState : null;
}

export function findNoodeViewModel(noodel: NoodelState, id: string): Noode {
    let noode = noodel.idMap.get(id);
    
    return noode ? noode.viewModel : null;
}

export function isIdRegistered(noodel: NoodelState, id: string): boolean {
    return noodel.idMap.has(id);
}

export function changeNoodeId(noodel: NoodelState, oldId: string, newId: string) {
    let noode = noodel.idMap.get(oldId);

    noode.viewState.id = newId;
    noodel.idMap.delete(oldId);
    noodel.idMap.set(newId, noode);
}