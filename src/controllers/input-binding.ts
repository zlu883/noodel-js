import { startPan, updatePan, releasePan, unsetLimitIndicators, doJumpNavigation, shiftFocalNoode, shiftFocalLevel } from './noodel-navigate';
import Hammer from 'hammerjs';
import NoodelView from '@/types/NoodelView';

function onKeyDown(noodel: NoodelView, event: KeyboardEvent) {    

    if (event.key === "ArrowDown") {
        shiftFocalNoode(noodel, 1);
    }
    
    if (event.key === "ArrowUp") {
        shiftFocalNoode(noodel, -1);
    }
    
    if (event.key === "ArrowLeft") {
        shiftFocalLevel(noodel, -1);
    }
    
    if (event.key === "ArrowRight") {
        shiftFocalLevel(noodel, 1);
    }
}

function onWheel(noodel: NoodelView, ev: WheelEvent) {

    if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) {
        if (noodel.hasPress) {
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
        if (ev.deltaX > 0) {
            shiftFocalLevel(noodel, 1);
        }
        else if (ev.deltaX < 0) {
            shiftFocalLevel(noodel, -1);
        }
    }
}

function onPanStart(noodel: NoodelView, ev: HammerInput) {
    
    const src = noodel.pointerDownSrcNoodeEl;

    // known issue: using scrollLeft does not account for rtl direction
    if (src) {
        if ((ev.direction === Hammer.DIRECTION_RIGHT && src.scrollLeft !== 0) ||
        (ev.direction === Hammer.DIRECTION_LEFT && Math.abs((src.scrollWidth - src.scrollLeft) - src.clientWidth) > 2) ||
        (ev.direction === Hammer.DIRECTION_UP && Math.abs((src.scrollHeight - src.scrollTop) - src.clientHeight) > 2) ||
        (ev.direction === Hammer.DIRECTION_DOWN && src.scrollTop !== 0)) {
            noodel.doInnerScroll = true;
            noodel.innerScrollOriginTop = src.scrollTop;
            noodel.innerScrollOriginLeft = src.scrollLeft;
        }
    }
    
    noodel.hasPress = false;

    if (noodel.doInnerScroll) return;

    startPan(noodel, ev);
}

function onPan(noodel: NoodelView, ev: HammerInput) {

    if (noodel.nextPanRafId) cancelAnimationFrame(noodel.nextPanRafId);

    noodel.nextPanRafId = requestAnimationFrame(() => {
        if (noodel.doInnerScroll) {
            noodel.pointerDownSrcNoodeEl.scrollLeft = noodel.innerScrollOriginLeft - ev.deltaX;
            noodel.pointerDownSrcNoodeEl.scrollTop = noodel.innerScrollOriginTop - ev.deltaY;
        }
        else {
            updatePan(noodel, ev);
        }

        noodel.nextPanRafId = undefined;
    });
}

function onPanEnd(noodel: NoodelView, ev: HammerInput) {

    if (noodel.nextPanRafId) cancelAnimationFrame(noodel.nextPanRafId);

    noodel.nextPanRafId = requestAnimationFrame(() => {
        if (noodel.doInnerScroll) {
            noodel.doInnerScroll = false;
            noodel.innerScrollOriginTop = 0;
            noodel.innerScrollOriginLeft = 0;
            noodel.pointerDownSrcNoodeEl = null;
            noodel.pointerDownSrcNoode = null;
        }  
        else {
            releasePan(noodel, ev); 
        }

        noodel.nextPanRafId = undefined;
    });
}

function onPress(noodel: NoodelView, ev: HammerInput) {
    noodel.hasPress = true;
}

function onPressUp(noodel: NoodelView, ev: HammerInput) {
    noodel.pointerDownSrcNoodeEl = null;
    noodel.pointerDownSrcNoode = null;
    noodel.hasPress = false;
}

function onTap(noodel: NoodelView, ev: HammerInput) {
    noodel.hasPress = false;
        
    if (noodel.pointerDownSrcNoode) {
        let target = noodel.pointerDownSrcNoode;
        
        noodel.pointerDownSrcNoodeEl = null;
        noodel.pointerDownSrcNoode = null;
        doJumpNavigation(noodel, target);
    }
}

export function setupNoodelInputBindings(el: Element, noodel: NoodelView) {

    el.addEventListener('keydown', (ev: KeyboardEvent) => onKeyDown(noodel, ev));
    el.addEventListener('wheel', (ev: WheelEvent) => {
        onWheel(noodel, ev);
        ev.preventDefault();
    });

    const manager = new Hammer.Manager(el);

    manager.add(new Hammer.Swipe({direction: Hammer.DIRECTION_ALL}));
    manager.add(new Hammer.Pan({threshold: 3, direction: Hammer.DIRECTION_ALL}));
    manager.add(new Hammer.Tap());
    manager.add(new Hammer.Press({time: 0}));

    manager.get('swipe').recognizeWith('pan').recognizeWith('press');

    manager.on("panstart", (ev) => onPanStart(noodel, ev));
    manager.on("pan", (ev) => onPan(noodel, ev));
    manager.on("panend", (ev) => onPanEnd(noodel, ev));
    manager.on("press", (ev) => onPress(noodel, ev));
    manager.on("pressup", (ev) => onPressUp(noodel, ev));
    manager.on('tap', (ev) => onTap(noodel, ev));
}