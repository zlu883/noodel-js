export default interface NoodeDefinition {

    id?: string;
    children?: NoodeDefinition[];
    activeChildIndex?: number;
    content?: string;
}
