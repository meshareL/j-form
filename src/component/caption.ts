import { h as createElement, inject } from 'vue';
import type {
    VNodeProps,
    AllowedComponentProps,
    ComponentCustomProps,
    HTMLAttributes,
    FunctionalComponent
} from 'vue';
import { fetchShareIdKey, ShareIdProvider } from '../key';

const component: FunctionalComponent = (_, { slots }) => {
    const fetchShareId = inject(fetchShareIdKey, null)
        , shareId = fetchShareId?.fetch()
        , data: Record<string, unknown> = { class: 'caption' };

    if (fetchShareId?.provider !== ShareIdProvider.MASTHEAD) {
        data['id'] = shareId?.concat('_masthead');
    }

    return createElement('span', data, slots['default']?.());
};

component.displayName = 'JCaption';
component.inheritAttrs = true;

export default component as FunctionalComponent<
    VNodeProps
        & AllowedComponentProps
        & ComponentCustomProps
        & Omit<HTMLAttributes, 'id'>,
    Record<string, never>
>;
