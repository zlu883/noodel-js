/**
 * Object template used for passing a Vue component as node content.
 */
export default interface ComponentContent {
    /**
     * Vue component to be rendered using Vue's <component> tag. Can be name or component reference.
     */
    component: string | object | Function;
    /**
     * Name-value pairs of props to pass to this component.
     */
    props?: object;
    /**
     * Name-value pairs of event listeners to pass to this component.
     */
    eventListeners?: object;
}