import { startSwipe, updateSwipe, releaseSwipe, shiftRight, shiftLeft, shiftDown, shiftUp, unsetLimitIndicators, jumpToNoode } from './noodel-navigate';
import Hammer from 'hammerjs';
import NoodelView from '@/model/NoodelView';

function onKeyDown(noodel: NoodelView, event: KeyboardEvent) {    

    if (noodel.hasSwipe) return;
    if (noodel.isLocked) return;

    if (event.key === "ArrowDown") {
        shiftDown(noodel);
    }
    else if (event.key === "ArrowUp") {
        shiftUp(noodel);
    }
    else if (event.key === "ArrowLeft") {
        shiftLeft(noodel);
    }
    else if (event.key === "ArrowRight") {
        shiftRight(noodel);
    }
}

function onKeyUp(noodel: NoodelView, event: KeyboardEvent) {
    unsetLimitIndicators(noodel);
}

function onWheel(noodel: NoodelView, ev: WheelEvent) {

    if (noodel.hasSwipe) return;
    if (noodel.isLocked) return;

    if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) {
        if (noodel.hasPress) {
            if (ev.deltaY > 0) {
                shiftRight(noodel);
            }
            else if (ev.deltaY < 0) {
                shiftLeft(noodel);
            }
        }
        else {
            if (ev.deltaY > 0) {
                shiftDown(noodel);
            }
            else if (ev.deltaY < 0) {
                shiftUp(noodel);
            }
        }      
    }
    else if (Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) {
        if (ev.deltaX > 0) {
            shiftRight(noodel);
        }
        else if (ev.deltaX < 0) {
            shiftLeft(noodel);
        }
    }

    clearTimeout(noodel.limitIndicatorTimeout);
    noodel.limitIndicatorTimeout = setTimeout(() => unsetLimitIndicators(noodel), 300);
}

function onPanStart(noodel: NoodelView, ev: HammerInput) {
    
    const src = noodel.pointerDownSrcContentBox;

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
    if (noodel.hasSwipe) return;
    if (noodel.isLocked) return;

    noodel.hasSwipe = true;
    startSwipe(noodel, ev);
}

function onPan(noodel: NoodelView, ev: HammerInput) {

    if (noodel.doInnerScroll) {
        noodel.pointerDownSrcContentBox.scrollLeft = noodel.innerScrollOriginLeft - ev.deltaX;
        noodel.pointerDownSrcContentBox.scrollTop = noodel.innerScrollOriginTop - ev.deltaY;
    }
    else {
        if (!noodel.hasSwipe) return;
        updateSwipe(noodel, ev);
    }
}

function onPanEnd(noodel: NoodelView, ev: HammerInput) {

    if (noodel.doInnerScroll) {
        noodel.doInnerScroll = false;
        noodel.innerScrollOriginTop = 0;
        noodel.innerScrollOriginLeft = 0;
        noodel.pointerDownSrcContentBox = null;
        noodel.pointerDownSrcNoodePath = null;
    }  
    else {
        if (!noodel.hasSwipe) return;
        noodel.hasSwipe = false;
        releaseSwipe(noodel, ev); 
    }
}

function onPress(noodel: NoodelView, ev: HammerInput) {
    noodel.hasPress = true;
}

function onPressUp(noodel: NoodelView, ev: HammerInput) {
    noodel.pointerDownSrcContentBox = null;
    noodel.pointerDownSrcNoodePath = null;
    noodel.hasPress = false;
}

function onTap(noodel: NoodelView, ev: HammerInput) {
    noodel.hasPress = false;
    
    if (noodel.hasSwipe) return;
    //if (noodel.isLocked) return;
    
    if (noodel.pointerDownSrcNoodePath) {
        jumpToNoode(noodel, noodel.pointerDownSrcNoodePath.split(' ').map(i => parseInt(i)));
        noodel.pointerDownSrcContentBox = null;
        noodel.pointerDownSrcNoodePath = null;
    }
}

export function setupNoodelInputBindings(el: Element, noodel: NoodelView) {

    el.addEventListener('keydown', (ev: KeyboardEvent) => onKeyDown(noodel, ev));
    el.addEventListener('keyup', (ev: KeyboardEvent) => onKeyUp(noodel, ev));
    el.addEventListener('wheel', (ev: WheelEvent) => {
        onWheel(noodel, ev);
        ev.preventDefault();
    });

    const manager = new Hammer.Manager(el);

    manager.add(new Hammer.Swipe({direction: Hammer.DIRECTION_ALL}));
    manager.add(new Hammer.Pan({direction: Hammer.DIRECTION_ALL}));
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