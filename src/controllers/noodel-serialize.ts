import NoodeClassNames from '../types/NoodeClassNames';
import NoodeDefinition from '../types/NoodeDefinition';
import NoodelState from '../types/NoodelState';
import NoodeSerializedCss from '../types/NoodeSerializedCss';
import NoodeState from '../types/NoodeState';
import NoodeStyles from '../types/NoodeStyles';

export function parseClassName(className: string): string[] {
    if (!className) return [];
    
    return className.split(' ');
}

export function parseStyle(style: string): object {
    if (!style) return {};

    let styleObj = {};

    // does not validate the format of the style string - will throw error if wrong format
    style.split(';')
        .map(s => s.split(':').map(t => t.trim()))
        .forEach(s => styleObj[s[0]] = s[1]);

    return styleObj;
}

function serializeClassName(className: string[]): string {
    return className.length > 0 ? className.join(' ') : null;
}

function serializeStyle(style: object): string {
    let str = '';

    Object.keys(style).forEach(k => str += (k + ': ' + style[k] + '; '));
    str.trimEnd();
    
    return str || null;
}

export function parseClassNames(classNames: NoodeSerializedCss): NoodeClassNames {
    return {
        noode: parseClassName(classNames.noode),
        contentBox: parseClassName(classNames.contentBox),
        childIndicator: parseClassName(classNames.childIndicator),
        overflowIndicatorTop: parseClassName(classNames.overflowIndicatorTop),
        overflowIndicatorBottom: parseClassName(classNames.overflowIndicatorBottom),
        overflowIndicatorLeft: parseClassName(classNames.overflowIndicatorLeft),
        overflowIndicatorRight: parseClassName(classNames.overflowIndicatorRight),
        branch: parseClassName(classNames.branch),
        branchBackdrop: parseClassName(classNames.branchBackdrop)
    };
}

export function parseStyles(styles: NoodeSerializedCss): NoodeStyles {
    return {
        noode: parseStyle(styles.noode),
        contentBox: parseStyle(styles.contentBox),
        childIndicator: parseStyle(styles.childIndicator),
        overflowIndicatorTop: parseStyle(styles.overflowIndicatorTop),
        overflowIndicatorBottom: parseStyle(styles.overflowIndicatorBottom),
        overflowIndicatorLeft: parseStyle(styles.overflowIndicatorLeft),
        overflowIndicatorRight: parseStyle(styles.overflowIndicatorRight),
        branch: parseStyle(styles.branch),
        branchBackdrop: parseStyle(styles.branchBackdrop)
    };
}

export function serializeClassNames(classNames: NoodeClassNames): NoodeSerializedCss {
    return {
        noode: serializeClassName(classNames.noode),
        contentBox: serializeClassName(classNames.contentBox),
        childIndicator: serializeClassName(classNames.childIndicator),
        overflowIndicatorTop: serializeClassName(classNames.overflowIndicatorTop),
        overflowIndicatorBottom: serializeClassName(classNames.overflowIndicatorBottom),
        overflowIndicatorLeft: serializeClassName(classNames.overflowIndicatorLeft),
        overflowIndicatorRight: serializeClassName(classNames.overflowIndicatorRight),
        branch: serializeClassName(classNames.branch),
        branchBackdrop: serializeClassName(classNames.branchBackdrop)
    };
}

export function serializeStyles(styles: NoodeStyles): NoodeSerializedCss {
    return {
        noode: serializeStyle(styles.noode),
        contentBox: serializeStyle(styles.contentBox),
        childIndicator: serializeStyle(styles.childIndicator),
        overflowIndicatorTop: serializeStyle(styles.overflowIndicatorTop),
        overflowIndicatorBottom: serializeStyle(styles.overflowIndicatorBottom),
        overflowIndicatorLeft: serializeStyle(styles.overflowIndicatorLeft),
        overflowIndicatorRight: serializeStyle(styles.overflowIndicatorRight),
        branch: serializeStyle(styles.branch),
        branchBackdrop: serializeStyle(styles.branchBackdrop)
    };
}

export function extractNoodeDefinition(noodel: NoodelState, noode: NoodeState): NoodeDefinition {

    let def: NoodeDefinition = {
        id: noode.id,
        content: noode.content,
        isActive: noode.isActive,
        children: noode.children.map(c => extractNoodeDefinition(noodel, c)),
        classNames: serializeClassNames(noode.classNames),
        styles: serializeStyles(noode.styles),
        options: {
            ...noode.options
        },
    };

    return def;
}