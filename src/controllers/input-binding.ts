import { startPan, updatePan, releasePan, doJumpNavigation, shiftFocalNoode, shiftFocalLevel } from './noodel-navigate';
import Hammer from 'hammerjs';
import NoodelView from '@/types/NoodelView';
import NoodeView from '@/types/NoodeView';
import { exitInspectMode, enterInspectMode } from './inspect-mode';

function onKeyDown(noodel: NoodelView, event: KeyboardEvent) {    

    if (event.key === "Shift") {
        noodel.isShiftKeyPressed = true;
    }
    else if (event.key === "Enter") {
        if (noodel.isInInspectMode) {
            exitInspectMode(noodel);
        }
        else {
            enterInspectMode(noodel);
        }
    }

    if (noodel.isInInspectMode) return;

    if (event.key === "ArrowDown") {
        shiftFocalNoode(noodel, 1);
    }
    else if (event.key === "ArrowUp") {
        shiftFocalNoode(noodel, -1);
    }
    else if (event.key === "ArrowLeft") {
        shiftFocalLevel(noodel, -1);
    }
    else if (event.key === "ArrowRight") {
        shiftFocalLevel(noodel, 1);
    }
}

function onKeyUp(noodel: NoodelView, event: KeyboardEvent) {
    if (event.key === "Shift") {
        noodel.isShiftKeyPressed = false;
    }
}

function onWheel(noodel: NoodelView, ev: WheelEvent) {

    if (noodel.isInInspectMode) return;

    if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) {
        if (noodel.isShiftKeyPressed) {
            if (ev.deltaY > 0) {
                shiftFocalLevel(noodel, 1);
            }
            else if (ev.deltaY < 0) {
                shiftFocalLevel(noodel, -1);
            }
        }
        else {
            if (ev.deltaY > 0) {
                shiftFocalNoode(noodel, 1);
            }
            else if (ev.deltaY < 0) {
                shiftFocalNoode(noodel, -1);
            }
        }      
    }
    else if (Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) {
        if (noodel.isShiftKeyPressed) {
            if (ev.deltaY > 0) {
                shiftFocalNoode(noodel, 1);
            }
            else if (ev.deltaY < 0) {
                shiftFocalNoode(noodel, -1);
            }
        }
        else {
            if (ev.deltaX > 0) {
                shiftFocalLevel(noodel, 1);
            }
            else if (ev.deltaX < 0) {
                shiftFocalLevel(noodel, -1);
            }
        }      
    }
}

function onPanStart(noodel: NoodelView, ev: HammerInput) {
    if (noodel.isInInspectMode) return;

    startPan(noodel, ev);
}

function onPan(noodel: NoodelView, ev: HammerInput) {

    if (noodel.nextPanRafId) cancelAnimationFrame(noodel.nextPanRafId);
    if (noodel.panAxis === null) return;

    noodel.nextPanRafId = requestAnimationFrame(() => {
        updatePan(noodel, ev);
        noodel.nextPanRafId = undefined;
    });
}

function onPanEnd(noodel: NoodelView, ev: HammerInput) {
    if (noodel.nextPanRafId) cancelAnimationFrame(noodel.nextPanRafId);
    if (noodel.panAxis === null) return;

    noodel.nextPanRafId = requestAnimationFrame(() => {
        releasePan(noodel, ev); 
        noodel.nextPanRafId = undefined;
    });
}

function onCanvasDoubleTap(noodel: NoodelView, ev: HammerInput) {
    if (noodel.panAxis !== null) return;

    if (noodel.isInInspectMode) {
        exitInspectMode(noodel);
    }
    else {
        enterInspectMode(noodel);
    }
}

function onNoodeTap(noodel: NoodelView, noode: NoodeView, ev: HammerInput) {
    
    if (noodel.isInInspectMode) return;

    doJumpNavigation(noodel, noode);
}

export function setupCanvasInput(el: HTMLDivElement, noodel: NoodelView) {

    el.addEventListener('keydown', (ev: KeyboardEvent) => onKeyDown(noodel, ev));
    el.addEventListener('keyup', (ev: KeyboardEvent) => onKeyUp(noodel, ev));
    el.addEventListener('wheel', (ev: WheelEvent) => onWheel(noodel, ev));

    const manager = new Hammer.Manager(el);

    manager.add(new Hammer.Swipe({direction: Hammer.DIRECTION_ALL}));
    manager.add(new Hammer.Pan({threshold: 10, direction: Hammer.DIRECTION_ALL}));
    manager.add(new Hammer.Tap({taps: 2}));

    manager.get('swipe').recognizeWith('pan');

    manager.on("panstart", (ev) => onPanStart(noodel, ev));
    manager.on("pan", (ev) => onPan(noodel, ev));
    manager.on("panend", (ev) => onPanEnd(noodel, ev));
    manager.on('tap', (ev) => onCanvasDoubleTap(noodel, ev));

    noodel.hammerJsInstance = manager;
}

export function setupNoodeInput(el: HTMLDivElement, noode: NoodeView, noodel: NoodelView) {

    const manager = new Hammer.Manager(el);

    manager.add(new Hammer.Tap());
    manager.on('tap', (ev) => onNoodeTap(noodel, noode, ev));
}