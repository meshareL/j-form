import { h as createElement, inject } from 'vue';
import type {
    VNodeProps,
    AllowedComponentProps,
    ComponentCustomProps,
    LabelHTMLAttributes,
    FunctionalComponent
} from 'vue';
import { fetchShareIdKey, ShareIdProvider } from '../key';

const component: FunctionalComponent = (_, { slots }) => {
    const fetchShareId = inject(fetchShareIdKey, null)
        , shareId = fetchShareId?.fetch()
        , data: Record<string, unknown> = { for: shareId };

    if (fetchShareId?.provider !== ShareIdProvider.MASTHEAD
        && fetchShareId?.provider !== ShareIdProvider.CHOICE_GROUP) {
        data['id'] = shareId?.concat('_masthead');
    }

    return createElement('label', data, slots['default']?.());
};

component.displayName = 'JLabel';
component.inheritAttrs = true;

export default component as FunctionalComponent<
    VNodeProps
        & AllowedComponentProps
        & ComponentCustomProps
        & Omit<LabelHTMLAttributes, 'for'>,
    Record<string, never>
>;
