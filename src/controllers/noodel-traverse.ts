import NoodeView from '@/model/NoodeView';
import { isRoot, getActiveChild } from '@/util/getters';
import NoodelView from '@/model/NoodelView';

export function traverseAncestors(origin: NoodeView, task: (noode: NoodeView) => any, includeOrigin: boolean, includeRoot: boolean) {

    if (includeOrigin) task(origin);

    while (true) {
        origin = origin.parent;

        if (!origin) break;

        if (isRoot(origin)) {
            if (includeRoot) task(origin);
            break;
        }

        task(origin);
    }
}

export function traverseDescendents(origin: NoodeView, task: (descendent: NoodeView) => any, includeOrigin: boolean) {
    if (includeOrigin) task(origin);

    origin.children.forEach(child => {
        traverseDescendents(child, task, true);
    });
}

export function traverseActiveDescendents(
    origin: NoodeView, 
    task: (descendent: NoodeView) => any, 
    includeOrigin: boolean, 
    includeTail: boolean, 
    maxDepth: number = Number.MAX_SAFE_INTEGER
) {
    if (includeOrigin) task(origin);

    while (true) {
        if (maxDepth <= 0) break;

        origin = getActiveChild(origin);

        if (!origin) break;

        if (!getActiveChild(origin)) {
            if (includeTail) task(origin);
            break;
        }
        
        task(origin);
        maxDepth--;
    }
}

export function findNoodeByPath(noodel: NoodelView, path: number[]): NoodeView {

    let target = noodel.root;

    for (let i = 0; i < path.length; i++) {
        target = target.children[path[i]];
        if (!target) return null;
    }

    return target;
}