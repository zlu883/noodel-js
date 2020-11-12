import NodeOptions from './NodeOptions';
import ComponentContent from './ComponentContent';
import NodeCss from './NodeCss';

/**
 * Object template used for node creation and insertion.
 */
export default interface NodeDefinition {
    /**
     * ID of this node. If provided, must be unique and should NOT start with "_" .
     */
    id?: string;
    /**
     * Children nodes of this node. Defaults to an empty array.
     */
    children?: NodeDefinition[];
    /**
     * If provided, will mark this node as active, overriding the default (first child).
     * If multiple siblings are marked as active, only the first one will take effect.
     */
    isActive?: boolean;
    /**
     * Content of this node. If is a string, will be inserted as innerHTML of the nd-node element.
     * Can also be a ComponentContent object that wraps a Vue component.
     */
    content?: string | ComponentContent;
    /**
     * An object specifying custom CSS class(es) to apply to various elements associated with a
     * node. Each property should be a string of one or more classes delimited by spaces. 
     */
    classNames?: NodeCss;
    /**
     * An object specifying custom CSS styles to apply to various elements associated with a
     * node. Each property should be a string in inline style format. 
     */
    styles?: NodeCss;
    /**
     * Options for this node.
     */
    options?: NodeOptions;
}
