import Noode from '../main/Noode';

export default interface NoodelEventMap {
    'mount': () => any;
    'focalNoodeChange': (current: Noode, prev: Noode) => any;
    'focalParentChange': (current: Noode, prev: Noode) => any;
    'enterInspectMode': () => any;
    'exitInspectMode': () => any;
}