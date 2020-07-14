import { startPan, updatePan, releasePan, doJumpNavigation, shiftFocalNoode, shiftFocalLevel } from './noodel-navigate';
import Hammer from 'hammerjs';
import NoodelView from '@/types/NoodelView';
import { exitInspectMode, enterInspectMode } from './inspect-mode';
import { throttle } from './throttle';

function onKeyDown(noodel: NoodelView, ev: KeyboardEvent) {   
    
    if (checkInputPreventClass(noodel, ev, 'nd-prevent-key')) return;

    if (ev.key === "Shift") {
        noodel.isShiftKeyPressed = true;
    }
    else if (ev.key === "Enter") {
        if (!noodel.options.useInspectModeKey) return;
        if (noodel.isInInspectMode) {
            exitInspectMode(noodel);
        }
        else {
            enterInspectMode(noodel);
        }
    }

    if (!noodel.options.useKeyNavigation) return;
    if (noodel.isInInspectMode) return;

    if (ev.key === "ArrowDown") {
        shiftFocalNoode(noodel, 1);
    }
    else if (ev.key === "ArrowUp") {
        shiftFocalNoode(noodel, -1);
    }
    else if (ev.key === "ArrowLeft") {
        shiftFocalLevel(noodel, -1);
    }
    else if (ev.key === "ArrowRight") {
        shiftFocalLevel(noodel, 1);
    }
    else if (ev.key === " " || ev.key === "Spacebar") {
        if (noodel.isShiftKeyPressed) {
            shiftFocalNoode(noodel, -3);
        }
        else {
            shiftFocalNoode(noodel, 3);
        }
    }
    else if (ev.key === "PageDown") {
        if (noodel.isShiftKeyPressed) {
            shiftFocalLevel(noodel, 3);
        }
        else {
            shiftFocalNoode(noodel, 3);
        }
    }
    else if (ev.key === "PageUp") {
        if (noodel.isShiftKeyPressed) {
            shiftFocalLevel(noodel, -3);
        }
        else {
            shiftFocalNoode(noodel, -3);
        }
    }
    else if (ev.key === "Home") {
        if (noodel.isShiftKeyPressed) {
            shiftFocalLevel(noodel, Number.MIN_SAFE_INTEGER);
        }
        else {
            shiftFocalNoode(noodel, Number.MIN_SAFE_INTEGER);
        }
    }
    else if (ev.key === "End") {
        if (noodel.isShiftKeyPressed) {
            shiftFocalLevel(noodel, Number.MAX_SAFE_INTEGER);
        }
        else {
            shiftFocalNoode(noodel, Number.MAX_SAFE_INTEGER);
        }
    }
}

function onKeyUp(noodel: NoodelView, event: KeyboardEvent) {
    if (event.key === "Shift") {
        noodel.isShiftKeyPressed = false;
    }
}

function onWheel(noodel: NoodelView, ev: WheelEvent) {

    if (!noodel.options.useWheelNavigation) return;
    if (noodel.isInInspectMode) return;
    if (checkInputPreventClass(noodel, ev, 'nd-prevent-wheel')) return;

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

    if (!noodel.options.useSwipeNavigation) return;
    if (noodel.isInInspectMode) return;
    if (checkInputPreventClass(noodel, ev.srcEvent, 'nd-prevent-swipe')) return;

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

function onTap(noodel: NoodelView, ev: HammerInput) {

    if (noodel.panAxis !== null) return;
    if (checkInputPreventClass(noodel, ev.srcEvent, 'nd-prevent-tap')) return;

    if ((ev as any).tapCount === 1) {
        if (!noodel.options.useTapNavigation) return;
        if (noodel.isInInspectMode) return;        
        if (noodel.pointerUpSrcNoode) {
            doJumpNavigation(noodel, noodel.pointerUpSrcNoode);
        }
    }
    else if ((ev as any).tapCount === 2) {
        if (!noodel.options.useInspectModeDoubleTap) return;
        if (noodel.isInInspectMode) {
            exitInspectMode(noodel);
        }
        else {
            enterInspectMode(noodel);
        }
    }
}

function checkInputPreventClass(noodel: NoodelView, ev: Event, className: string): boolean {
    
    let target = ev.target;

    while (true) {
        let classList = (target as any).classList;

        if (classList && classList.contains(className)) {
            return true;
        }

        if (target === noodel.canvasEl) {
            return false;
        }

        target = (target as any).parentElement;

        if (!target) return false;
    }
}

export function setupCanvasInput(el: HTMLDivElement, noodel: NoodelView) {

    el.addEventListener('keydown', (ev: KeyboardEvent) => throttle(noodel, 'keydown', () => onKeyDown(noodel, ev), 60));
    el.addEventListener('keyup', (ev: KeyboardEvent) => onKeyUp(noodel, ev));
    el.addEventListener('wheel', (ev: WheelEvent) => throttle(noodel, 'wheel', () => onWheel(noodel, ev), 80));

    const manager = new Hammer.Manager(el);

    let swipe = new Hammer.Swipe({direction: Hammer.DIRECTION_ALL});
    let pan = new Hammer.Pan({threshold: 10, direction: Hammer.DIRECTION_ALL});
    let singleTap = new Hammer.Tap({taps: 1, posThreshold: 100});
    let doubleTap = new Hammer.Tap({taps: 2, posThreshold: 100});

    manager.add([swipe, pan, doubleTap, singleTap]);

    swipe.recognizeWith(pan);
    singleTap.recognizeWith(doubleTap);

    manager.on("panstart", (ev) => onPanStart(noodel, ev));
    manager.on("pan", (ev) => onPan(noodel, ev));
    manager.on("panend", (ev) => onPanEnd(noodel, ev));
    manager.on('tap', (ev) => onTap(noodel, ev));

    noodel.hammerJsInstance = manager;
}