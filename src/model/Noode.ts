export default interface Noode {

    id?: string;
    children?: Noode[];
    activeChildIndex?: number;
    content?: string;
}
