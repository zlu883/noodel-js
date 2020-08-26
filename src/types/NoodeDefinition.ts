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
     * If provided, will mark the child at this index as active, overriding the default (first child). 
     * Takes precedence over the isActive marker in child noode definitions.
     * @deprecated recommend to use isActive instead
     */
    activeChildIndex?: number;
    /**
     * If provided, will mark this noode as active, overriding the default (first child).
     * If multiple siblings are marked as active, only the first one will take effect.
     */
    isActive?: boolean;
    /**
     * Content of this noode.
     */
    content?: string | ComponentContent;
    /**
     * Custom class(es) for this noode. Either a string of class names delimited by spaces
     * or an array.
     */
    className?: string | string[];
    /**
     * Custom styles for this noode. Either a string in inline style format
     * or an object in {"property": "value"} format.
     */
    style?: string | object;
    /**
     * Options for this noode.
     */
    options?: NoodeOptions;
}
