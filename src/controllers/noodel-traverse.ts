import NoodeState from '../types/NoodeState';
import { isRoot, getActiveChild } from '../util/getters';
import NoodelState from '../types/NoodelState';

export function traverseAncestors(origin: NoodeState, task: (noode: NoodeState) => any, includeOrigin: boolean, includeRoot: boolean) {

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

export function traverseDescendents(origin: NoodeState, task: (descendent: NoodeState) => any, includeOrigin: boolean) {
    if (includeOrigin) task(origin);

    origin.children.forEach(child => {
        traverseDescendents(child, task, true);
    });
}

export function traverseActiveDescendents(
    origin: NoodeState, 
    task: (descendent: NoodeState) => any, 
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

export function findNoodeByPath(noodel: NoodelState, path: number[]): NoodeState {

    let target = noodel.root;

    for (let i = 0; i < path.length; i++) {
        target = target.children[path[i]];
        if (!target) return null;
    }

    return target;
}