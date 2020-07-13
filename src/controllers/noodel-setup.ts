import NoodeDefinition from '../types/NoodeDefinition';
import NoodelOptions from '../types/NoodelOptions';
import NoodeView from '../types/NoodeView';
import NoodelView from '@/types/NoodelView';
import { ResizeSensor } from 'css-element-queries';
import { showActiveSubtree } from './noodel-mutate';
import { setupRouting, unsetRouting } from './noodel-routing';
import NoodeOptions from '@/types/NoodeOptions';
import { generateNoodeId, registerNoode, findNoode } from './id-register';
import { alignNoodelOnJump } from './noodel-navigate';

export function setupNoodel(root: NoodeDefinition, options: NoodelOptions): NoodelView {

    let noodel: NoodelView = {
        idCount: -1,
        idMap: new Map([]),
        root: null,
        focalParent: null,
        focalLevel: 1,
        
        trunkOffset: 0,
        trunkOffsetAligned: 0,
        applyTrunkMove: false,

        showLimits: {
            top: false,
            bottom: false,
            left: false,
            right: false
        },
        panOffsetOriginTrunk: null,
        panOffsetOriginFocalBranch: null,
        panAxis: null,
        isInInspectMode: false,

        containerSize: {
            x: 0,
            y: 0
        },
        
        options: {
            visibleSubtreeDepth: 1,
            swipeFrictionBranch: 0.7,
            swipeFrictionTrunk: 0.2,
            swipeWeightBranch: 100,
            swipeWeightTrunk: 100,
            useRouting: true
        }
    }

    let rootNoode = buildNoodeView(noodel, root, 1, 0, null);

    rootNoode.isActive = true;
    rootNoode.isFocalParent = true;
    noodel.root = rootNoode;
    noodel.focalParent = rootNoode;

    parseAndApplyOptions(options, noodel);
    
    showActiveSubtree(rootNoode, noodel.options.visibleSubtreeDepth);

    if (noodel.options.useRouting) {
        let hash = window.location.hash;

        if (hash) {
            let target = findNoode(noodel, hash.substr(1));

            if (target && target.parent) {
                alignNoodelOnJump(noodel, target);
            }
        } 
    }

    return noodel;
}

/**
 * Recursively parses the given HTML element into a noode tree. 
 */
export function parseHTMLToNoode(el: Element): NoodeDefinition {

    let id = el.getAttribute('data-id');
    let className = el.getAttribute('data-class');
    let style = el.getAttribute('data-style');
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
        children: children,
        className: className,
        style: style
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

export function parseAndApplyOptions(options: NoodelOptions, noodel: NoodelView) {

    if (typeof options.visibleSubtreeDepth === "number") {
        noodel.options.visibleSubtreeDepth = options.visibleSubtreeDepth;
    }

    if (typeof options.swipeWeightBranch === "number") {
        noodel.options.swipeWeightBranch = options.swipeWeightBranch;
    }

    if (typeof options.swipeWeightTrunk === "number") {
        noodel.options.swipeWeightTrunk = options.swipeWeightTrunk;
    }

    if (typeof options.swipeFrictionBranch === "number") {
        noodel.options.swipeFrictionBranch = options.swipeFrictionBranch;
    }

    if (typeof options.swipeFrictionTrunk === "number") {
        noodel.options.swipeFrictionTrunk = options.swipeFrictionTrunk;
    }

    if (typeof options.useRouting === "boolean") {
        noodel.options.useRouting = options.useRouting;
    }

    if (options.onMount === null || typeof options.onMount === "function") {
        noodel.options.onMount = options.onMount;
    }

    if (options.onFocalNoodeChange === null || typeof options.onFocalNoodeChange === "function") {
        noodel.options.onFocalNoodeChange = options.onFocalNoodeChange;
    }

    if (options.onFocalParentChange === null || typeof options.onFocalParentChange === "function") {
        noodel.options.onFocalParentChange = options.onFocalParentChange;
    }

    if (noodel.options.useRouting) {
        setupRouting(noodel);
    }
    else {
        unsetRouting(noodel);
    }
}

export function parseAndApplyNoodeOptions(options: NoodeOptions, noode: NoodeView) {

    if (typeof options.skipResizeDetection === "boolean") {
        noode.options.skipResizeDetection = options.skipResizeDetection;
    }

    if (options.onEnterFocus === null || typeof options.onEnterFocus === "function") {
        noode.options.onEnterFocus = options.onEnterFocus;
    }

    if (options.onExitFocus === null || typeof options.onExitFocus === "function") {
        noode.options.onExitFocus = options.onExitFocus;
    }

    if (options.onChildrenEnterFocus === null || typeof options.onChildrenEnterFocus === "function") {
        noode.options.onChildrenEnterFocus = options.onChildrenEnterFocus;
    }

    if (options.onChildrenExitFocus === null || typeof options.onChildrenExitFocus === "function") {
        noode.options.onChildrenExitFocus = options.onChildrenExitFocus;
    }
}

export function buildNoodeView(noodel: NoodelView, def: NoodeDefinition, level: number, index: number, parent: NoodeView): NoodeView {
    
    let noodeView: NoodeView = {
        index: index,
        level: level,
        isChildrenVisible: false,
        isChildrenTransparent: true,
        isFocalParent: false,
        isActive: false,
        size: 0,
        trunkRelativeOffset: 0,
        childBranchOffset: 0,
        childBranchOffsetAligned: 0,
        applyBranchMove: false,
        isInInspectMode: false,
        branchRelativeOffset: 0,
        branchSize: 0,
        parent: parent,
        id: typeof def.id === 'string' ? def.id : generateNoodeId(noodel),
        children: [],
        content: def.content || null,
        className: parseClassName(def.className),
        style: parseStyle(def.style),
        activeChildIndex: null,
        options: {
            skipResizeDetection: false
        }
    }

    registerNoode(noodel, noodeView.id, noodeView);

    if (def.options && typeof def.options === "object") {
        parseAndApplyNoodeOptions(def.options, noodeView);
    }

    let numOfChildren = Array.isArray(def.children) ? def.children.length : 0;

    if (typeof def.activeChildIndex !== 'number') {
        noodeView.activeChildIndex = numOfChildren > 0 ? 0 : null;
    }
    else {
        if (def.activeChildIndex < 0 || def.activeChildIndex >= numOfChildren) {
            console.warn("Invalid initial active child index for noode ID " + noodeView.id);
            noodeView.activeChildIndex = numOfChildren > 0 ? 0 : null;
        }
        else {
            noodeView.activeChildIndex = def.activeChildIndex;
        }
    }

    if (parent && index === parent.activeChildIndex) {
        noodeView.isActive = true;
    }

    if (numOfChildren > 0) {
        noodeView.children = def.children.map((n, i) => buildNoodeView(noodel, n, level + 1, i, noodeView));
    }

    return noodeView;
}

export function extractNoodeDefinition(noode: NoodeView): NoodeDefinition {

    return {
        id: noode.id,
        content: noode.content,
        activeChildIndex: noode.activeChildIndex,
        children: noode.children.map(c => extractNoodeDefinition(c)),
        className: noode.className,
        style: noode.style
    };
}

export function parseClassName(className: string | string[]): string[] {
    if (Array.isArray(className)) return className;
    if (className && typeof className === 'string') return className.split(' ');
    return [];
}

export function parseStyle(style: string | object): object {
    if (style && typeof style === 'object') return style;
    if (style && typeof style === 'string') {
        let styles = style.split(';').map(s => s.split(':').map(t => t.trim())).filter(s => s.length === 2);
        let styleObj = {};

        styles.forEach(s => {
            styleObj[s[0]] = s[1];
        });

        return styleObj;
    } 

    return {};
}