/* Module for methods of traversing the noodel tree. */

import NodeState from '../types/NodeState';
import { getActiveChild } from './getters';

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

export function traverseDescendants(origin: NodeState, task: (desc: NodeState) => any, includeOrigin: boolean) {
    if (includeOrigin) task(origin);

    origin.children.forEach(child => {
        traverseDescendants(child, task, true);
    });
}

export function traverseActiveDescendants(
    origin: NodeState, 
    task: (desc: NodeState) => any, 
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