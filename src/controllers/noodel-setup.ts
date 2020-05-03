import NoodeDefinition from '../model/NoodeDefinition';
import NoodelOptions from '../model/NoodelOptions';
import NoodeView from '../model/NoodeView';
import NoodelView from '@/model/NoodelView';
import { getActiveChild } from '@/util/getters';
import { ResizeSensor } from 'css-element-queries';
import { setActiveSubtreeVisibility, setActiveChild } from './noodel-mutate';
import { traverseDescendents } from './noodel-traverse';
import IdRegister from '@/main/IdRegister';

export function setupNoodel(idRegister: IdRegister, root: NoodeDefinition, options?: NoodelOptions): NoodelView {

    let rootNoode = buildNoodeView(idRegister, root, 0, 0, null);

    rootNoode.isActive = true;

    let noodel = {
        root: rootNoode,
        focalParent: null,
        focalLevel: null,
        
        trunkOffset: 0,
        trunkOffsetOrigin: 0,
        trunkRelativeOffset: 0,
    
        showLimits: {
            top: false,
            bottom: false,
            left: false,
            right: false
        },
        movingAxis: null,
        hasPress: false,
        hasSwipe: false,

        lastSwipeDelta: 0,
        totalSwipeDelta: 0,

        containerSize: {
            x: 0,
            y: 0
        },
        
        options: {
            visibleSubtreeDepth: 1,
            snapDuration: 600
        }
    }

    mergeOptions(options, noodel);

    traverseDescendents(rootNoode, noode => setActiveChild(noode, noode.activeChildIndex), true);

    let focalLevel = 0;
    let focalParent = rootNoode;

    if (Array.isArray(options.initialPath)) {
        for (let i = 0; i < options.initialPath.length; i++) {
            let nextIndex = options.initialPath[i];
    
            if (typeof nextIndex !== "number" || nextIndex < 0 || nextIndex > focalParent.children.length) {
                throw new Error("Invalid initial path at index " + i);
            }
    
            setActiveChild(focalParent, nextIndex);

            if (i < options.initialPath.length - 1) { // only when not in last iteration
                focalParent = getActiveChild(focalParent);
            }          
        }
    
        if (options.initialPath.length > 0) {
            focalLevel = options.initialPath.length - 1;
        }  
    }

    noodel.focalParent = focalParent;
    noodel.focalParent.isFocalParent = true;
    noodel.focalLevel = focalLevel;
    setActiveSubtreeVisibility(rootNoode, true, focalLevel + noodel.options.visibleSubtreeDepth);

    return noodel;
}

/**
 * Recursively parses the given HTML element into a noode tree. 
 */
export function parseHTMLToNoode(el: Element): NoodeDefinition {

    let id = el.getAttribute('data-id');
    let activeChildIndex = 0;
    let content = '';
    let noodeCount = 0;
    let children: NoodeDefinition[] = [];

    for (let i = 0; i < el.childNodes.length; i++) {
        const node = el.childNodes[i];

        if (node.nodeType === Node.TEXT_NODE) {
            content += node.textContent; // Depends on css white-space property for ignoring white spaces
        }
        else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.nodeName === "DIV" && (node as Element).className.split(' ').some(c => c === 'noode')) {
                noodeCount++;

                if ((node as Element).hasAttribute('data-active')) {
                    activeChildIndex = noodeCount - 1;
                }

                children.push(parseHTMLToNoode(node as Element));
            }
            else {
                content += (node as Element).outerHTML; // Depends on css white-space property for ignoring white spaces
            }
        }
    }

    return {
        id: id,
        content: content,
        activeChildIndex: children.length > 0 ? activeChildIndex : null,
        children: children
    };
}

export function setupContainer(el: Element, noodel: NoodelView) {

    let rect = el.getBoundingClientRect();

    noodel.containerSize.x = rect.width;
    noodel.containerSize.y = rect.height;

    new ResizeSensor(el, (size) => {
        noodel.containerSize.x = size.width,
        noodel.containerSize.y = size.height
    });
}

export function mergeOptions(options: NoodelOptions, noodel: NoodelView) {

    if (typeof options.visibleSubtreeDepth === "number") {
        noodel.options.visibleSubtreeDepth = options.visibleSubtreeDepth;
    }

    if (typeof options.snapDuration === "number") {
        noodel.options.snapDuration = options.snapDuration;
    }

    if (typeof options.mounted === "function") {
        noodel.options.mounted = options.mounted;
    }
}

export function buildNoodeView(idRegister: IdRegister, def: NoodeDefinition, level: number, index: number, parent: NoodeView): NoodeView {
    
    let noodeView: NoodeView = {
        index: index,
        level: level,
        isChildrenVisible: false,
        isFocalParent: false,
        isActive: false,
        size: 0,
        offset: 0,
        branchOffset: 0,
        branchOffsetOrigin: 0,
        branchRelativeOffset: 0,
        branchSize: 0,
        parent: parent,
        id: typeof def.id === 'string' ? def.id : idRegister.generateNoodeId(),
        children: [],
        content: def.content || null,
        activeChildIndex: null
    }

    idRegister.registerNoode(noodeView.id, noodeView);

    if (Array.isArray(def.children)) {
        noodeView.children = def.children.map((n, i) => buildNoodeView(idRegister, n, level + 1, i, noodeView));
    }

    if (typeof def.activeChildIndex !== 'number') {
        noodeView.activeChildIndex = noodeView.children.length > 0 ? 0 : null;
    }
    else {
        if (def.activeChildIndex < 0 || def.activeChildIndex >= noodeView.children.length) {
            console.warn("Invalid initial active child index for noode ID " + noodeView.id);
            noodeView.activeChildIndex = noodeView.children.length > 0 ? 0 : null;
        }
        else {
            noodeView.activeChildIndex = def.activeChildIndex;
        }
    }

    return noodeView;
}

export function extractNoodeDefinition(noode: NoodeView): NoodeDefinition {

    return {
        id: noode.id,
        content: noode.content,
        activeChildIndex: noode.activeChildIndex,
        children: noode.children.map(c => extractNoodeDefinition(c))
    };
}