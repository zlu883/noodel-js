import ComponentContent from '../types/ComponentContent';
import NodeDefinition from '../types/NodeDefinition';
import NodeState from '../types/NodeState';

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