import NoodelView from '@/types/NoodelView';
import NoodeView from '@/types/NoodeView';

export function generateNoodeId(noodel: NoodelView) {
    noodel.idCount++;
    return '_' + noodel.idCount.toString();
}

export function registerNoode(noodel: NoodelView, id: string, noode: NoodeView) {
    if (noodel.idMap.has(id)) {
        throw new Error("Cannot register new noode: duplicate ID");
    }

    noodel.idMap.set(id, noode);
}

export function unregisterNoode(noodel: NoodelView, id: string) {
    noodel.idMap.delete(id);
}

export function findNoode(noodel: NoodelView, id: string) {
    return noodel.idMap.get(id);
}