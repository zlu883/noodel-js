import NoodelView from '@/types/NoodelView';

export function throttle(noodel: NoodelView, key: string, func: () => any, delay: number) {
    if (noodel.throttleMap.get(key)) return;

    func();

    noodel.throttleMap.set(key, true);

    setTimeout(() => {
        noodel.throttleMap.set(key, false);
    }, delay);
}