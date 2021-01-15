/* Module for functions associated with FLIP animation. */

import NodeState from 'src/types/NodeState';
import { nextTick } from 'vue';
import { forceReflow } from './util';

/**
 * Captures the position of all child nodes on this tick,
 * and apply FLIP animations to them after *2* ticks (in order to account for exit offsets which
 * are set after 1 tick).
 */
export function queueFlipAnimation(parent: NodeState) {
    if (parent.r.flipAnimationQueued) return;
    if (!parent.isBranchMounted) return;

    parent.r.flipAnimationQueued = true;

    let nodes = parent.r.branchSliderEl.querySelectorAll('.nd-node');
    
    nodes.forEach(el => {
        el['_nd_flip_first'] = el.getBoundingClientRect();
    });

    nextTick(() => {
        nextTick(() => {
            // split into multiple loops to reduce layout thrashing
            nodes.forEach(el => {
                el.classList.remove('nd-node-move');
            });

            nodes.forEach(el => {
                el['_nd_flip_last'] = el.getBoundingClientRect();
            });
        
            nodes.forEach(el => {
                const dx = el['_nd_flip_first'].left - el['_nd_flip_last'].left;
                const dy = el['_nd_flip_first'].top - el['_nd_flip_last'].top;
                
                if (dx || dy) {
                    (el as HTMLDivElement).style.transform = `translate(${dx}px,${dy}px)`;
                }
            });
    
            forceReflow();
    
            nodes.forEach(el => {
                delete el['_nd_flip_first'];
                delete el['_nd_flip_last'];
                const s = (el as HTMLDivElement).style;
                s.transform = ``;
                el.classList.add('nd-node-move');
            });
    
            parent.r.flipAnimationQueued = false;
        });
    })
}