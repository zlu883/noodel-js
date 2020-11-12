import NoodelNode from '../main/NoodelNode';

export default interface NoodelEventMap {
    'mount': () => any;
    'focalNodeChange': (current: NoodelNode, prev: NoodelNode) => any;
    'focalParentChange': (current: NoodelNode, prev: NoodelNode) => any;
    'enterInspectMode': () => any;
    'exitInspectMode': () => any;
}