import NoodeView from '@/model/NoodeView';

/**
 * Forces a reflow on browsers by doing a computed property access.
 * Modern (naughty) browsers tend to over-optimize things such that
 * transform/opacity transitions will glitch if the property is changed
 * during an ongoing transition. Forcing a reflow when a new transition is
 * expected eliminates the problem (magic!).
 */
export function forceReflow() {
    document.body.getBoundingClientRect();
}

export function takePositionSnapshot(noode: NoodeView) {

    if (!noode.posSnapshot) {
        let rect = noode.el.getBoundingClientRect();

        noode.posSnapshot = {x: rect.left, y: rect.top};
    }
}

export function calculateInvert(noode: NoodeView) {

    if (!noode.posSnapshot) return;

    noode.flipInvert = noode.posSnapshot.y - noode.el.getBoundingClientRect().y;
    noode.posSnapshot = null;
}

export function applyInvert(noode: NoodeView) {
    if (typeof noode.flipInvert === 'number') {
        (noode.el as HTMLDivElement).style.transform = 'translateY(' + noode.flipInvert + 'px)';
        (noode.el as HTMLDivElement).style.transitionProperty = 'opacity';
    }
}

export function releaseInvert(noode: NoodeView) {
    (noode.el as HTMLDivElement).style.transform = '';
    (noode.el as HTMLDivElement).style.transitionProperty = '';
}