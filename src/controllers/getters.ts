import NodeState from '../types/NodeState';
import NoodelState from '../types/NoodelState';
import { traverseAncestors } from './noodel-traverse';

export function getFocalNode(noodel: NoodelState) {
    return getActiveChild(noodel.focalParent);
}

export function getActiveChild(node: NodeState) {
    let activeChildIndex = node.activeChildIndex;
    
    if (activeChildIndex === null) return null;
    return node.children[activeChildIndex];
}

export function getPath(node: NodeState): number[] {
    let path = [];

    traverseAncestors(node, node => {
        path.push(node.index);
    }, true, false);

    return path.reverse();
}

export function getFocalPositionX(noodel: NoodelState) {
    let posX = noodel.options.focalPositionX;

    if (typeof posX === 'number') {
        return posX;
    }
    else {
        return posX(noodel.canvasWidth, noodel.canvasHeight);
    }
}

export function getFocalPositionY(noodel: NoodelState) {
    let posY = noodel.options.focalPositionY;

    if (typeof posY === 'number') {
        return posY;
    }
    else {
        return posY(noodel.canvasWidth, noodel.canvasHeight);
    }
}

export function getFocalPositionTrunk(noodel: NoodelState): number {
    let orientation = noodel.options.orientation;

    if (orientation === 'ltr') {
        return getFocalPositionX(noodel);
    }
    else if (orientation === 'rtl') {
        return -getFocalPositionX(noodel);
    }
    else if (orientation === 'ttb') {
        return getFocalPositionY(noodel);
    }
    else if (orientation === 'btt') {
        return -getFocalPositionY(noodel);
    }
}

export function getFocalPositionBranch(noodel: NoodelState) {
    let options = noodel.options;
    let orientation = options.orientation;
    let branchDirection = options.branchDirection;

    if (orientation === 'ltr' || orientation === 'rtl') {
        if (branchDirection === 'normal') {
            return getFocalPositionY(noodel);
        }
        else if (branchDirection === 'reverse') {
            return -getFocalPositionY(noodel);
        }
    }
    else {
        if (branchDirection === 'normal') {
            return getFocalPositionX(noodel);
        }
        else if (branchDirection === 'reverse') {
            return -getFocalPositionX(noodel);
        }
    }
}

export function getAlignmentOffsetTrunk(noodel: NoodelState) {
    let options = noodel.options;
    let focalSize = noodel.focalParent.branchSize;
    let orientation = options.orientation;

    if (orientation === 'ltr') {
        let alignment = options.focalAlignmentX;

        if (alignment === 'center') {
            return -focalSize / 2;
        }
        else if (alignment === 'left') {
            return 0;
        }
        else {
            return -focalSize;
        }
    }
    else if (orientation === 'rtl') {
        let alignment = options.focalAlignmentX;

        if (alignment === 'center') {
            return -focalSize / 2;
        }
        else if (alignment === 'left') {
            return -focalSize;
        }
        else {
            return 0;
        }
    }
    else if (orientation === 'ttb') {
        let alignment = options.focalAlignmentY;

        if (alignment === 'center') {
            return -focalSize / 2;
        }
        else if (alignment === 'top') {
            return 0;
        }
        else {
            return -focalSize;
        }
    }
    else { // btt
        let alignment = options.focalAlignmentY;

        if (alignment === 'center') {
            return -focalSize / 2;
        }
        else if (alignment === 'top') {
            return -focalSize;
        }
        else {
            return 0;
        }
    }
}

export function getAlignmentOffsetBranch(noodel: NoodelState) {
    let options = noodel.options;
    let focalSize = getFocalNode(noodel).size;
    let orientation = options.orientation;
    let branchDirection = options.branchDirection;

    if (orientation === 'ltr' || orientation === 'rtl') {
        let alignment = options.focalAlignmentY;

        if (branchDirection === 'normal') {
            if (alignment === 'center') {
                return -focalSize / 2;
            }
            else if (alignment === 'top') {
                return 0;
            }
            else {
                return -focalSize;
            }
        }
        else if (branchDirection === 'reverse') {
            if (alignment === 'center') {
                return -focalSize / 2;
            }
            else if (alignment === 'top') {
                return -focalSize;
            }
            else {
                return 0;
            }
        }
    }
    else { // btt or ttb
        let alignment = options.focalAlignmentX;

        if (branchDirection === 'normal') {
            if (alignment === 'center') {
                return -focalSize / 2;
            }
            else if (alignment === 'left') {
                return 0;
            }
            else {
                return -focalSize;
            }
        }
        else if (branchDirection === 'reverse') {
            if (alignment === 'center') {
                return -focalSize / 2;
            }
            else if (alignment === 'left') {
                return -focalSize;
            }
            else {
                return 0;
            }
        }
    }
}