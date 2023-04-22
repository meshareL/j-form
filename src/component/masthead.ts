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
    name: 'JMasthead',
    inheritAttrs: true,
    setup(_, { slots }) {
        const shareId = inject(fetchShareIdKey, null)?.fetch()
            , mastheadId = shareId?.concat('_masthead');

        provide(fetchShareIdKey, {
            fetch: () => shareId,
            provider: ShareIdProvider.MASTHEAD
        });

        return () => {
            const data: Record<string, unknown> = {
                id: mastheadId,
                class: 'masthead'
            };

            return createElement('div', data, slots['default']?.());
        };
    }
});

/**
 * @example
 * <Masthead>
 *     <Label>Label</Label>
 *     <Summary>Summary</Summary>
 * </Masthead>
 *
 * <Masthead>
 *     <Caption>Caption</Caption>
 *     <Summary>Summary</Summary>
 * </Masthead>
 */
export default component as new() => {
    $props:
        VNodeProps
        & AllowedComponentProps
        & ComponentCustomProps
        & Omit<HTMLAttributes, 'id'>

    $slots: {
        default?: () => VNode[]
    }
};
