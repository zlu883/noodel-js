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