import NoodelView from '../types/NoodelView';
import NoodeView from '../types/NoodeView';
import { traverseDescendents } from './noodel-traverse';
import Noode from '../main/Noode';

export function generateNoodeId(noodel: NoodelView) {
    noodel.idCount++;
    return '_' + noodel.idCount.toString();
}

/**
 * Register a noode and all its descendents.
 */
export function registerNoodeSubtree(noodel: NoodelView, subtreeRoot: NoodeView) {
    traverseDescendents(subtreeRoot, (desc) => {
        noodel.idMap.set(desc.id, {view: desc, viewModel: new (Noode as any)(desc, noodel, desc["data"])});
        // removes the custom data reference to avoid it being tracked by Vue
        delete desc["data"];
    }, true);
}

/**
 * Unregister a noode and all its descendents.
 */
export function unregisterNoodeSubtree(noodel: NoodelView, noode: NoodeView) {
    traverseDescendents(noode, (desc) => {
        noodel.idMap.delete(desc.id);
    }, true);
}

export function findNoodeView(noodel: NoodelView, id: string): NoodeView {
    let noode = noodel.idMap.get(id);

    return noode ? noode.view : null;
}

export function findNoodeViewModel(noodel: NoodelView, id: string): Noode {
    let noode = noodel.idMap.get(id);
    
    return noode ? noode.viewModel : null;
}

export function isIdRegistered(noodel: NoodelView, id: string): boolean {
    return noodel.idMap.has(id);
}

export function changeNoodeId(noodel: NoodelView, oldId: string, newId: string) {
    let noode = noodel.idMap.get(oldId);

    noode.view.id = newId;
    noodel.idMap.delete(oldId);
    noodel.idMap.set(newId, noode);
}