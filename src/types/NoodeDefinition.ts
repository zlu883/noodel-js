import NoodeOptions from './NoodeOptions';
import ComponentContent from './ComponentContent';

export default interface NoodeDefinition {

    id?: string;
    children?: NoodeDefinition[];
    isActive?: boolean;
    activeChildIndex?: number;
    content?: string | ComponentContent;
    className?: string | string[];
    style?: string | object;
    options?: NoodeOptions;
}
