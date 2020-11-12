import NodeState from '../types/NodeState';
import { getActiveChild } from './getters';
import NoodelState from '../types/NoodelState';

export function traverseAncestors(origin: NodeState, task: (node: NodeState) => any, includeOrigin: boolean, includeRoot: boolean) {

    if (includeOrigin) task(origin);

    while (true) {
        origin = origin.parent;

        if (!origin) break;

        if (origin.r.isRoot) {
            if (includeRoot) task(origin);
            break;
        }

        task(origin);
    }
}

export function traverseDescendents(origin: NodeState, task: (descendent: NodeState) => any, includeOrigin: boolean) {
    if (includeOrigin) task(origin);

    origin.children.forEach(child => {
        traverseDescendents(child, task, true);
    });
}

export function traverseActiveDescendents(
    origin: NodeState, 
    task: (descendent: NodeState) => any, 
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

export function findNodeByPath(noodel: NoodelState, path: number[]): NodeState {

    let target = noodel.root;

    for (let i = 0; i < path.length; i++) {
        target = target.children[path[i]];
        if (!target) return null;
    }

    return target;
}