import NoodelNode from '../main/NoodelNode';

export default interface NodeEventMap {
    'enterFocus': (prev: NoodelNode) => any;
    'exitFocus': (current: NoodelNode) => any;
    'childrenEnterFocus': (prev: NoodelNode) => any;
    'childrenExitFocus': (current: NoodelNode) => any;
}