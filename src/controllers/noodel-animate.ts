import NoodeView from '@/model/NoodeView';
import Vue from 'vue';

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
 * Animates the positions of sibling noodes during noode insertion, deletion or resize.
 * Inspired by the FLIP algorithm used in Vue's v-move feature (which cannot be directly used
 * due to oddities of the way branches are aligned). 
 */
export function animateNoodeSizeChange(noode: NoodeView, sizeDiff: number) {
    let parent = noode.parent;
    let parentTop = parent.childBranchEl.getBoundingClientRect().top;

    for (let i = noode.index + 1; i < parent.children.length; i++) {
        let sibling = parent.children[i]; 

        // Calculates the current offset of siblings (even if they are midway in transition)
        let currentOffset = sibling.el.getBoundingClientRect().top - parentTop;

        // Calculates the invert value necessary to transition translate to 0, starting from the current
        // offset. Needs to subtract the size diff because this function is called "after the fact", i.e.
        // after the size change has occurred and noodes shifted, so need to negate that as well.
        sibling.flipInvert = -(sibling.branchRelativeOffset - (currentOffset - sizeDiff));
    } 

    //forceReflow();

    // wait one tick for style changes to take hold, before removing the invert
   Vue.nextTick(() => {
    forceReflow();
        //requestAnimationFrame(() => {
            for (let i = noode.index + 1; i < parent.children.length; i++) {
                parent.children[i].flipInvert = 0;
            }    
                    

        //});
    })    
}