import NoodeOptions from './NoodeOptions';
import ComponentContent from './ComponentContent';
import NoodeSerializedCss from './NoodeSerializedCss';

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
     * If provided, will mark this noode as active, overriding the default (first child).
     * If multiple siblings are marked as active, only the first one will take effect.
     */
    isActive?: boolean;
    /**
     * Content of this noode. If is a string, will be inserted as innerHTML of the nd-noode element.
     * Can also be a ComponentContent object that wraps a Vue component.
     */
    content?: string | ComponentContent;
    /**
     * An object specifying custom CSS class(es) to apply to various elements associated with a
     * noode. Each property should be a string of one or more classes delimited by spaces. 
     */
    classNames?: NoodeSerializedCss;
    /**
     * An object specifying custom CSS styles to apply to various elements associated with a
     * noode. Each property should be a string in inline style format. 
     */
    styles?: NoodeSerializedCss;
    /**
     * Options for this noode.
     */
    options?: NoodeOptions;
}
