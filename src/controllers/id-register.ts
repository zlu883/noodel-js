import NoodelView from '../types/NoodelView';
import NoodeView from '../types/NoodeView';
import Noode from 'src/main/Noode';

export function generateNoodeId(noodel: NoodelView) {
    noodel.idCount++;
    return '_' + noodel.idCount.toString();
}

export function registerNoode(noodel: NoodelView, id: string, noode: Noode, noodeView: NoodeView) {
    if (noodel.noodeViewMap.has(id)) {
        throw new Error("Cannot register new noode: duplicate ID");
    }

    noodel.noodeViewMap.set(id, noodeView);
    noodel.noodeMap.set(id, noode);
}

export function unregisterNoode(noodel: NoodelView, id: string) {
    noodel.noodeViewMap.delete(id);
    noodel.noodeMap.delete(id);
}

export function findNoodeView(noodel: NoodelView, id: string) {
    return noodel.noodeViewMap.get(id);
}

export function findNoode(noodel: NoodelView, id: string) {
    return noodel.noodeMap.get(id);
}