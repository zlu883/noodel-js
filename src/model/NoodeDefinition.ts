import NoodeOptions from './NoodeOptions';

export default interface NoodeDefinition {

    id?: string;
    children?: NoodeDefinition[];
    activeChildIndex?: number;
    content?: string;
    options?: NoodeOptions;
}
