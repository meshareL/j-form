import { h as createElement } from 'vue';
import type { FunctionalComponent } from 'vue';

type Prop = {
    disabled?: boolean;
    selected?: boolean;
    label?: string;
    value: string;
};

// todo: option ::before 伪元素
const component: FunctionalComponent<Prop> = (props, { slots }) => {
    return createElement('option', props, slots['default']?.());
};

component.displayName = 'JOption';
component.inheritAttrs = true;
component.props = {
    disabled: {
        type: Boolean,
        required: false,
        default: false
    },
    selected: {
        type: Boolean,
        required: false,
        default: false
    },
    label: {
        type: String,
        required: false
    },
    value: {
        type: String,
        required: false
    }
};

export default component;
export type { Prop };
