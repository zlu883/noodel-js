import NoodeOptions from './NoodeOptions';
import ComponentContent from './ComponentContent';

/**
 * Object template used for noode creation and insertion.
 */
export default interface NoodeDefinition {
    /**
     * ID of this noode. If provided, must be unique and should NOT start with "_" .
     */
    id?: string;
    /**
     * Children noodes of this noode. Defaults to an empty array.
     */
    children?: NoodeDefinition[];
    /**
     * If provided, will mark the child at this index as active, instead of the default first child. 
     */
    activeChildIndex?: number;
    /**
     * If provided, will mark this noode as active. Takes precedence over the activeChildIndex of the parent.
     * If multiple siblings are marked as active, the last one will take precedence.
     */
    isActive?: boolean;
    /**
     * Content of this noode.
     */
    content?: string | ComponentContent;
    /**
     * Custom class(es) for this noode. Either a string of class names delimited by spaces
     * or an array of class names.
     */
    className?: string | string[];
    /**
     * Custom styles for this noode. Either a style string in inline style format
     * or a style object in {"property": "value"} format.
     */
    style?: string | object;
    /**
     * Options for this noode.
     */
    options?: NoodeOptions;
}
