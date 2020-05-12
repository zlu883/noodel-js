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

/**
 * Prepare animation of sibling noodes due to a noode size change, by setting an invert translate.
 * Inspired by the FLIP algorithm used in Vue's v-move feature (which cannot be directly used
 * due to oddities of the way branches are aligned). 
 */
export function setSiblingInvertOnNoodeSizeChange(noode: NoodeView, sizeDiff: number) {
    let parent = noode.parent;
    let parentTop = parent.childBranchEl.getBoundingClientRect().top;

    for (let i = noode.index + 1; i < parent.children.length; i++) {
        let sibling = parent.children[i]; 

        if (sibling.flipInvert === 0) {
            // Calculates the current offset of siblings (even if they are midway in transition)
            let currentOffset = sibling.el.getBoundingClientRect().top - parentTop;

            // Calculates the invert value necessary to transition translate to 0, starting from the current
            // offset. Needs to subtract the size diff because this function is called "after the fact", i.e.
            // after the size change has occurred and noodes shifted, so need to negate that as well.
            sibling.flipInvert = -(sibling.branchRelativeOffset - (currentOffset - sizeDiff));
        }
        else {
            // if another size change has already set the invert in this tick, account for size diff only
            sibling.flipInvert -= sizeDiff;
        }

        if (i === 4) {
            console.log("invert: " + sibling.flipInvert);
            console.log("rel offset: " + sibling.branchRelativeOffset);
        }
    }                
}

/**
 * Start animation of sibling noodes by reseting their invert to 0.
 */
export function releaseSiblingInverts(noode: NoodeView) {
    let parent = noode.parent;

    forceReflow(); // Chrome needs a reflow here

    for (let i = noode.index + 1; i < parent.children.length; i++) {
        parent.children[i].flipInvert = 0;
    }   
}