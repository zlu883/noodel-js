import NoodeOptions from './NoodeOptions';

export default interface NoodeDefinition {

    id?: string;
    children?: NoodeDefinition[];
    activeChildIndex?: number;
    content?: string;
    className?: string | string[];
    style?: string | object;
    options?: NoodeOptions;
}
