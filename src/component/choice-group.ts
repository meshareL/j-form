import { defineComponent, h as createElement, inject, provide } from 'vue';
import type {
    VNodeProps,
    AllowedComponentProps,
    ComponentCustomProps,
    HTMLAttributes,
    VNode
} from 'vue';
import { fetchShareIdKey, ShareIdProvider } from '../key';

const component = defineComponent({
    name: 'JChoiceGroup',
    inheritAttrs: true,
    setup(_, { slots }) {
        const shareId = inject(fetchShareIdKey, null)?.fetch();

        provide(fetchShareIdKey, {
            fetch: () => shareId,
            provider: ShareIdProvider.CHOICE_GROUP
        });

        return () => {
            const data: Record<string, unknown> = { class: 'choice-group' };
            return createElement('div', data, slots['default']?.());
        };
    }
});

export default component as new() => {
    $props:
        VNodeProps
        & AllowedComponentProps
        & ComponentCustomProps
        & HTMLAttributes;

    $slots: {
        default?: () => VNode[]
    }
};
