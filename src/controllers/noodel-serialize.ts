import ComponentContent from '../types/ComponentContent';
import NoodeDefinition from '../types/NoodeDefinition';
import NoodelState from '../types/NoodelState';
import NoodeState from '../types/NoodeState';

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

export function extractNoodeDefinition(noodel: NoodelState, noode: NoodeState): NoodeDefinition {

    let def: NoodeDefinition = {
        id: noode.id,
        content: serializeContent(noode.content),
        isActive: noode.isActive,
        children: noode.children.map(c => extractNoodeDefinition(noodel, c)),
        classNames: {
            ...noode.classNames
        },
        styles: {
            ...noode.styles
        },
        options: {
            ...noode.options
        },
    };

    return def;
}