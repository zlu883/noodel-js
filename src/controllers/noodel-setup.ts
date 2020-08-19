import NoodeDefinition from '../types/NoodeDefinition';
import NoodelOptions from '../types/NoodelOptions';
import NoodeView from '../types/NoodeView';
import NoodelView from '../types/NoodelView';
import { ResizeSensor } from 'css-element-queries';
import { showActiveSubtree } from './noodel-mutate';
import { setupRouting, unsetRouting } from './noodel-routing';
import NoodeOptions from '../types/NoodeOptions';
import { generateNoodeId, registerNoode, findNoode } from './id-register';
import { alignNoodelOnJump, cancelPan } from './noodel-navigate';
import { traverseDescendents } from './noodel-traverse';

export function setupNoodel(root: NoodeDefinition, options: NoodelOptions): NoodelView {

    let noodel: NoodelView = {
        idCount: -1,
        idMap: new Map([]),
        throttleMap: new Map([]),
        debounceMap: new Map([]),
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
            retainDepthOnTapNavigation: false,
            swipeMultiplierBranch: 1,
            swipeMultiplierTrunk: 1,
            snapMultiplierBranch: 1,
            snapMultiplierTrunk: 1,
            subtreeDebounceInterval: 360,
            useRouting: true,
            useKeyNavigation: true,
            useWheelNavigation: true,
            useSwipeNavigation: true,
            useTapNavigation: true,
            useInspectModeKey: true,
            useInspectModeDoubleTap: true,
            skipResizeDetection: false,
            showLimitIndicators: true,
            showBranchColumns: false,
            showChildIndicators: true,
            onMount: null,
            onEnterInspectMode: null,
            onExitInspectMode: null,
            onFocalNoodeChange: null,
            onFocalParentChange: null
        }
    }

    let rootNoode = buildNoodeView(noodel, root, 1, 0, null);

    rootNoode.isActive = true;
    rootNoode.isFocalParent = true;
    noodel.root = rootNoode;
    noodel.focalParent = rootNoode;

    parseAndApplyOptions(options, noodel);
    
    showActiveSubtree(noodel, rootNoode, noodel.options.visibleSubtreeDepth);

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

    noodel.options = {
        ...noodel.options,
        ...options
    }

    if (!options.useSwipeNavigation) cancelPan(noodel);

    if (noodel.options.useRouting) {
        setupRouting(noodel);
    }
    else {
        unsetRouting(noodel);
    }
}

export function parseAndApplyNoodeOptions(options: NoodeOptions, noode: NoodeView) {

    noode.options = {
        ...noode.options,
        ...options
    }
}

export function buildNoodeView(noodel: NoodelView, def: NoodeDefinition, level: number, index: number, parent: NoodeView): NoodeView {
    
    function parseNoodeDef(noodel: NoodelView, def: NoodeDefinition, level: number, index: number, parent: NoodeView) {

        let noodeView: NoodeView = {
            index: index,
            level: level,
            isChildrenVisible: false,
            isChildrenTransparent: true,
            isFocalParent: false,
            isActive: false,
            size: 0,
            trunkRelativeOffset: parent ? parent.trunkRelativeOffset + parent.branchSize : 0,
            childBranchOffset: 0,
            childBranchOffsetAligned: 0,
            applyBranchMove: false,
            isInInspectMode: false,
            branchRelativeOffset: parent && index > 0 ? parent.children[index - 1].branchRelativeOffset + parent.children[index - 1].size : 0,
            branchSize: 0,
            parent: parent,
            id: typeof def.id === 'string' ? def.id : generateNoodeId(noodel),
            children: [],
            content: def.content || null,
            className: parseClassName(def.className),
            style: parseStyle(def.style),
            activeChildIndex: null,
            options: {
                skipResizeDetection: null,
                showBranchColumn: null,
                showChildIndicator: null,
                onChildrenEnterFocus: null,
                onChildrenExitFocus: null,
                onEnterFocus: null,
                onExitFocus: null,
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
    
        if (parent && def.isActive) {
            parent.activeChildIndex = index;
        }
    
        if (numOfChildren > 0) {
            for (let i = 0; i < def.children.length; i++) {
                noodeView.children.push(parseNoodeDef(noodel, def.children[i], level + 1, i, noodeView));
            }
        }
    
        return noodeView;
    }

    let defRoot = parseNoodeDef(noodel, def, level, index, parent);

    traverseDescendents(defRoot, (noode) => {
        if (noode.activeChildIndex !== null) {
            noode.children[noode.activeChildIndex].isActive = true;
        }
    }, true);

    return defRoot;
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