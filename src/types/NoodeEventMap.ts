import Noode from '../main/Noode';

export default interface NoodeEventMap {
    'enterFocus': (prev: Noode) => any;
    'exitFocus': (current: Noode) => any;
    'childrenEnterFocus': (prev: Noode) => any;
    'childrenExitFocus': (current: Noode) => any;
}