/* Module for parsing and serializing various entities. */

import { markRaw } from 'vue';
import ComponentContent from '../types/ComponentContent';
import NodeDefinition from '../types/NodeDefinition';
import NodeState from '../types/NodeState';

/**
 * Recursively parse the given HTML element into a tree of node definitions. 
 */
export function parseHTMLToNode(el: Element): NodeDefinition {

    let content = '';
    let branchContent = '';
    let children: NodeDefinition[] = [];

    for (let i = 0; i < el.childNodes.length; i++) {
        const node = el.childNodes[i];

        if (node.nodeType === Node.TEXT_NODE) {
            content += node.textContent; // Depends on css white-space property for ignoring white spaces
        }
        else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.nodeName === "DIV") {
                let classNames = (node as Element).className.split(' ');

                if (classNames.some(c => c === 'node')) {
                    children.push(parseHTMLToNode(node as Element));
                }
                else if (classNames.some(c => c === 'branch-content')) {
                    branchContent = (node as Element).innerHTML;
                }
            }
            else {
                content += (node as Element).outerHTML; // Depends on css white-space property for ignoring white spaces
            }
        }
    }

    let attributes = (el as HTMLElement).dataset;

    return {
        id: attributes.id || null,
        content: content || null,
        branchContent: branchContent || null,
        isActive: 'active' in attributes,
        children: children,
        classNames: {
            node: attributes.classNode,
            contentBox: attributes.classContentBox,
            childIndicator: attributes.classChildIndicator,
            branch: attributes.classBranch,
            branchContentBox: attributes.classBranchContentBox,
            branchSlider: attributes.classBranchSlider,
        },
        styles: {
            node: attributes.styleNode,
            contentBox: attributes.styleContentBox,
            childIndicator: attributes.styleChildIndicator,
            branch: attributes.styleBranch,
            branchContentBox: attributes.styleBranchContentBox,
            branchSlider: attributes.styleBranchSlider,
        },
        options: {
            useResizeDetection: attributes.useResizeDetection === 'true' ? true : attributes.useResizeDetection === 'false' ? false : null,
            useBranchResizeDetection: attributes.useBranchResizeDetection === 'true' ? true : attributes.useBranchResizeDetection === 'false' ? false : null,
            showChildIndicator: attributes.showChildIndicator === 'true' ? true : attributes.showChildIndicator === 'false' ? false : null,
        }
    };
}

export function parseContent(content: string | ComponentContent): string | ComponentContent {
    if (!content) return content;
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
        return {
            component: typeof content.component === 'object' ? markRaw(content.component) : content.component,
            props: {...content.props},
            eventListeners: {...content.eventListeners}
        }
    }
}

export function serializeContent(content: string | ComponentContent): string | ComponentContent {
    let serializedContent = content;

    if (serializedContent && typeof serializedContent === 'object') {
        serializedContent = {
            component: serializedContent.component,
            props: serializedContent.props ? {
                ...serializedContent.props
            } : null,
            eventListeners: serializedContent.eventListeners ? {
                ...serializedContent.eventListeners
            } : null
        }
    }

    return serializedContent;
}

export function serializeNode(node: NodeState): NodeDefinition {
    return {
        id: node.id,
        content: serializeContent(node.content),
        branchContent: serializeContent(node.branchContent),
        isActive: node.isActive,
        classNames: {
            ...node.classNames
        },
        styles: {
            ...node.styles
        },
        options: {
            ...node.options
        },
    }
}

export function serializeNodeDeep(node: NodeState): NodeDefinition {

    let def = serializeNode(node);

    def.children = node.children.map(c => serializeNodeDeep(c));
    return def;
}