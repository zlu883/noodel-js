import ComponentContent from '../types/ComponentContent';
import NodeDefinition from '../types/NodeDefinition';
import NoodelState from '../types/NoodelState';
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

export function extractNodeDefinition(noodel: NoodelState, node: NodeState): NodeDefinition {

    let def: NodeDefinition = {
        id: node.id,
        content: serializeContent(node.content),
        isActive: node.isActive,
        children: node.children.map(c => extractNodeDefinition(noodel, c)),
        classNames: {
            ...node.classNames
        },
        styles: {
            ...node.styles
        },
        options: {
            ...node.options
        },
    };

    return def;
}