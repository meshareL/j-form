import { h as createElement } from 'vue';
import type {
    FunctionalComponent,
    VNodeProps,
    AllowedComponentProps,
    ComponentCustomProps,
    HTMLAttributes
} from 'vue';

const component: FunctionalComponent = (_, { slots }) => {
    return createElement('span', { class: 'summary' }, slots['default']?.());
};

component.displayName = 'JSummary';
component.inheritAttrs = true;

export default component as FunctionalComponent<
    VNodeProps
        & AllowedComponentProps
        & ComponentCustomProps
        & HTMLAttributes,
    Record<string, never>
>;
