/* Module for setting up input bindings and logic for various input methods. */

import { jumpTo, shiftFocalNode, shiftFocalLevel } from './navigate';
import { startPan, updatePan, releasePan } from './pan';
import Hammer from 'hammerjs';
import NoodelState from '../types/NoodelState';
import { exitInspectMode, enterInspectMode } from './inspect-mode';
import { throttle } from './util';
import { getActiveChild, getBranchDirection, getOrientation, isEmpty, isPanning } from './getters';
import { Axis } from 'src/types/Axis';

/**
 * Trigger a noodel movement for the given real axis,
 * which will be converted to noodel axis based on the 
 * current orientation options.
 */
function moveNoodel(noodel: NoodelState, axis: Axis, diff: number) {
    let orientation = getOrientation(noodel);
	let branchDirection = getBranchDirection(noodel);

    if ((orientation === 'ltr' && axis === 'x') || (orientation === 'ttb' && axis === 'y')) {
        shiftFocalLevel(noodel, diff);
    }
    else if ((orientation === 'rtl' && axis === 'x') || (orientation === 'btt' && axis === 'y')) {
        shiftFocalLevel(noodel, -diff);
    }
    else {
        if (branchDirection === 'normal') {
            shiftFocalNode(noodel, diff);
        }
        else {
            shiftFocalNode(noodel, -diff);
        }  
    }
}

function onKeyDown(noodel: NoodelState, ev: KeyboardEvent) {   
    if (isEmpty(noodel)) return;
    if (checkInputPreventClass(noodel, ev, 'nd-prevent-key')) return;

    const key = ev.key;

    if (key === "Shift") {
        noodel.r.isShiftKeyPressed = true;
    }
    else if (key === "Enter") {
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

    const isShiftKeyPressed = noodel.r.isShiftKeyPressed;

    if (key === "ArrowDown") {
        moveNoodel(noodel, 'y', 1);
    }
    else if (key === "ArrowUp") {
        moveNoodel(noodel, 'y', -1);
    }
    else if (key === "ArrowLeft") {
        moveNoodel(noodel, 'x', -1);
    }
    else if (key === "ArrowRight") {
        moveNoodel(noodel, 'x', 1);
    }
    else if (key === " " || key === "Spacebar") {
        if (isShiftKeyPressed) {
            moveNoodel(noodel, 'x', 3);
        }
        else {
            moveNoodel(noodel, 'y', 3);
        }
    }
    else if (key === "PageDown") {
        if (isShiftKeyPressed) {
            moveNoodel(noodel, 'x', 3);
        }
        else {
            moveNoodel(noodel, 'y', 3);
        }
    }
    else if (key === "PageUp") {
        if (isShiftKeyPressed) {
            moveNoodel(noodel, 'x', -3);
        }
        else {
            moveNoodel(noodel, 'y', -3);
        }
    }
    else if (key === "Home") {
        if (isShiftKeyPressed) {
            moveNoodel(noodel, 'x', Number.MIN_SAFE_INTEGER);
        }
        else {
            moveNoodel(noodel, 'y', Number.MIN_SAFE_INTEGER);
        }
    }
    else if (key === "End") {
        if (isShiftKeyPressed) {
            moveNoodel(noodel, 'x', Number.MAX_SAFE_INTEGER);
        }
        else {
            moveNoodel(noodel, 'y', Number.MAX_SAFE_INTEGER);
        }
    }
}

function onKeyUp(noodel: NoodelState, event: KeyboardEvent) {
    if (event.key === "Shift") {
        noodel.r.isShiftKeyPressed = false;
    }
}

function onWheel(noodel: NoodelState, ev: WheelEvent) {
    if (!noodel.options.useWheelNavigation) return;
    if (isEmpty(noodel)) return;
    if (noodel.isInInspectMode) return;
    if (checkInputPreventClass(noodel, ev, 'nd-prevent-wheel')) return;

    if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) {
        if (noodel.r.isShiftKeyPressed) {
            if (ev.deltaY > 0) {
                moveNoodel(noodel, 'x', 1);
            }
            else if (ev.deltaY < 0) {
                moveNoodel(noodel, 'x', -1);
            }
        }
        else {
            if (ev.deltaY > 0) {
                moveNoodel(noodel, 'y', 1);
            }
            else if (ev.deltaY < 0) {
                moveNoodel(noodel, 'y', -1);
            }
        }      
    }
    else if (Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) {
        if (noodel.r.isShiftKeyPressed) {
            if (ev.deltaY > 0) {
                moveNoodel(noodel, 'y', 1);
            }
            else if (ev.deltaY < 0) {
                moveNoodel(noodel, 'y', -1);
            }
        }
        else {
            if (ev.deltaX > 0) {
                moveNoodel(noodel, 'x', 1);
            }
            else if (ev.deltaX < 0) {
                moveNoodel(noodel, 'x', -1);
            }
        }      
    }
}

function onPanStart(noodel: NoodelState, ev: HammerInput) {
    if (!noodel.options.useSwipeNavigation) return;
    if (isEmpty(noodel)) return;
    if (noodel.isInInspectMode) return;
    if (checkInputPreventClass(noodel, ev.srcEvent, 'nd-prevent-swipe')) return;

    let axis: Axis = null;
    let direction = ev.direction;

    if (direction === Hammer.DIRECTION_LEFT || direction === Hammer.DIRECTION_RIGHT) {
        axis = 'x';
    }
    else if (direction === Hammer.DIRECTION_UP || direction === Hammer.DIRECTION_DOWN) {
        axis = 'y';
    }

    startPan(noodel, axis);
}

function onPan(noodel: NoodelState, ev: HammerInput) {
    if (!isPanning(noodel)) return;
    updatePan(noodel, ev.velocityX, ev.velocityY, ev.deltaX, ev.deltaY, (ev as any).timeStamp);
}

function onPanEnd(noodel: NoodelState, ev: HammerInput) {
    if (!isPanning(noodel)) return;
    releasePan(noodel); 
}

function onTap(noodel: NoodelState, ev: HammerInput) {
    if (isEmpty(noodel)) return;
    if (isPanning(noodel)) return;
    if (checkInputPreventClass(noodel, ev.srcEvent, 'nd-prevent-tap')) return;

    if ((ev as any).tapCount === 1) {
        if (!noodel.options.useTapNavigation) return;
        if (noodel.isInInspectMode) return;        
        if (noodel.r.pointerUpSrcNode) {
            let target = noodel.r.pointerUpSrcNode;

            if (noodel.options.retainDepthOnTapNavigation && !target.isActiveLineage) {
                let levelDiff = getActiveChild(noodel.focalParent).level - target.level;

                for (let i = 0; i < levelDiff; i++) {
                    let next = getActiveChild(target);
                    
                    if (next) {
                        target = next;
                    }
                    else {
                        break;
                    }
                }
            }
                
            jumpTo(noodel, target);
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

function checkInputPreventClass(noodel: NoodelState, ev: Event, className: string): boolean {
    
    let target = ev.target;

    while (true) {
        let classList = (target as any).classList;

        if (classList && classList.contains(className)) {
            return true;
        }

        if (target === noodel.r.canvasEl) {
            return false;
        }

        target = (target as any).parentElement;

        if (!target) return false;
    }
}

export function setupCanvasInput(noodel: NoodelState) {

    let el = noodel.r.canvasEl;

    el.addEventListener('keydown', (ev: KeyboardEvent) => throttle(noodel, 'keydown', () => onKeyDown(noodel, ev), 60));
    el.addEventListener('keyup', (ev: KeyboardEvent) => onKeyUp(noodel, ev));
    el.addEventListener('wheel', (ev: WheelEvent) => throttle(noodel, 'wheel', () => onWheel(noodel, ev), 80));

    const manager = new Hammer.Manager(el);

    let pan = new Hammer.Pan({threshold: 10, direction: Hammer.DIRECTION_ALL});
    let singleTap = new Hammer.Tap({taps: 1, posThreshold: 100});
    let doubleTap = new Hammer.Tap({taps: 2, posThreshold: 100});

    manager.add([pan, doubleTap, singleTap]);

    singleTap.recognizeWith(doubleTap);

    manager.on("panstart", (ev) => onPanStart(noodel, ev));
    manager.on("pan", (ev) => onPan(noodel, ev));
    manager.on("panend", (ev) => onPanEnd(noodel, ev));
    manager.on('tap', (ev) => onTap(noodel, ev));

    noodel.r.hammerJsInstance = manager;
}