import NoodeView from '@/model/NoodeView';
import { traverseActiveDescendents } from './noodel-traverse';
import { getActiveChild } from '@/getters/getters';

export function setActiveChild(parent: NoodeView, index: number) {
    if (getActiveChild(parent)) {
        getActiveChild(parent).isActive = false;
    }

    parent.activeChildIndex = index;

    if (getActiveChild(parent)) {
        getActiveChild(parent).isActive = true;
    }
}

export function setActiveSubtreeVisibility(origin: NoodeView, visible: boolean, depth?: number) {
    traverseActiveDescendents(origin, desc => {
        desc.isChildrenVisible = visible;
    }, true, false, depth);
}

export function insertChild(parent: NoodeView, child: NoodeView, index?: number) {
    child.parent = parent;

    if (index === undefined) {
        parent.children.push(child);
    }
    else {
        parent.children.splice(index, 0, child);

        if (parent.activeChildIndex !== null && index <= parent.activeChildIndex) {
            parent.activeChildIndex++;
        }
    }

    if (parent.children.length === 1) {
        setActiveChild(parent, 0);
    }
}

export function insertChildren(parent: NoodeView, children: NoodeView[], index?: number) {
    children.forEach(child => {
        child.parent = parent;
    });

    if (index === undefined) {
        parent.children.push(...children);

        if (parent.children.length === children.length) {
            setActiveChild(parent, 0);
        }
    }
    else {
        parent.children.splice(index, 0, ...children);

        if (parent.activeChildIndex !== null && index <= parent.activeChildIndex) {
            parent.activeChildIndex += children.length;
        }
    }
}

export function deleteChild(parent: NoodeView, index: number): NoodeView {

    if (index < parent.activeChildIndex) {
        parent.activeChildIndex--;
    }
    else if (index === parent.activeChildIndex) {
        if (parent.children.length === 1) {
            setActiveChild(parent, null);
        }
        else if (parent.activeChildIndex === parent.children.length - 1) {
            setActiveChild(parent, parent.activeChildIndex - 1);
        }
        else {
            setActiveChild(parent, parent.activeChildIndex + 1);
            parent.activeChildIndex--;
        }
    }
    
    let deletedNoode = parent.children.splice(index, 1)[0];
    
    setActiveSubtreeVisibility(deletedNoode, false);
    deletedNoode.parent = null;
    return deletedNoode;
}

export function deleteChildren(parent: NoodeView, index: number, deleteCount: number): NoodeView[] {

    if (index + deleteCount <= parent.activeChildIndex) {
        parent.activeChildIndex-= deleteCount;
    }
    else if (index <= parent.activeChildIndex) {
        if (parent.children.length === deleteCount) {
            setActiveChild(parent, null);
        }
        else if (index + deleteCount < parent.children.length) {
            setActiveChild(parent, index + deleteCount);
        }
        else {
            setActiveChild(parent, index - 1);
        }
    }

    let deletedNoodes = parent.children.splice(index, deleteCount);

    deletedNoodes.forEach(noode => noode.parent = null);
    return deletedNoodes;
}