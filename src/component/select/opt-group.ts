import { h as createElement } from 'vue';
import type { FunctionalComponent } from 'vue';

type Prop = {
    disabled?: boolean;
    label?: string;
};

const component: FunctionalComponent<Prop> = (props, { slots }) => {
    const data: Record<string, unknown> = {
        disabled: props.disabled,
        label: props.label
    };
    return createElement('optgroup', data, slots['default']?.());
};

component.displayName = 'JOptGroup';
component.inheritAttrs = true;
component.props = {
    disabled: {
        type: Boolean,
        required: false,
        default: false
    },
    label: {
        type: String,
        required: false
    }
};

export default component;
export type { Prop };
