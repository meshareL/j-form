import {
    defineComponent,
    h as createElement,
    ref,
    inject,
    toRef,
    readonly,
    watch
} from 'vue';
import type {
    VNodeProps,
    AllowedComponentProps,
    ComponentCustomProps,
    InputHTMLAttributes
} from 'vue';
import {
    ValidationResult,
    fetchShareIdKey,
    inheritedDisabledKey,
    inheritedNameKey,
    delegateValidationKey
} from '../../key';
import { pushControlAction } from '../../helper/common';
import type { KebabCasedProperties } from 'type-fest';

type Prop = {
    modelValue?: string;
    disabled?: boolean;
    // radio name
    name?: string;
    value: string;
    defaultChecked?: boolean;
};

const component = defineComponent({
    name: 'JRadio',
    inheritAttrs: true,
    props: {
        modelValue: {
            type: String,
            required: false
        },
        disabled: {
            type: Boolean,
            required: false,
            default: false
        },
        name: {
            type: String,
            required: false
        },
        value: {
            type: String,
            required: true
        },
        defaultChecked: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    emits: [ 'update:modelValue' ],
    setup(props, { emit }) {
        const inputRef = ref<HTMLInputElement>()
            , shareId = inject(fetchShareIdKey)?.fetch()
            , isDisabled = inject(inheritedDisabledKey, () => readonly(toRef(props, 'disabled')), true)
            , inputName = inject(inheritedNameKey, () => readonly(toRef(props, 'name')), true);

        const inputChecked = ref(props.defaultChecked);

        watch(() => props.modelValue, value => {
            if (value === undefined) {
                return;
            }

            inputChecked.value = value === props.value;
        }, { immediate: true });

        const delegateValidation = inject(delegateValidationKey, null);

        function onChange(event: Event): void {
            const input = event.target;
            if (!(input instanceof HTMLInputElement)) return;

            inputChecked.value = input.checked;
            emit('update:modelValue', props.value);

            delegateValidation?.();
        }

        function checkValidity(): Promise<ValidationResult> {
            const input = inputRef.value;
            if (!(input instanceof HTMLInputElement)) {
                return Promise.reject();
            }

            if (!input.willValidate) {
                return Promise.resolve(ValidationResult.UNREQUIRED);
            }

            const result = input.checked
                ? ValidationResult.SUCCEED
                : ValidationResult.ERRORED;
            return Promise.resolve(result);
        }

        pushControlAction({
            checkValidity,
            focus: () => Promise.reject(),
            isSuitableFocus: () => false
        }, shareId);

        return () => {
            const data: Record<string, unknown> = {
                ref: inputRef,
                id: shareId,
                type: 'radio',
                name: inputName.value,
                value: props.value,
                disabled: isDisabled.value,
                checked: inputChecked.value,
                onChange
            };

            return createElement('input', data);
        };
    }
});

export default component as new() => {
    $props:
        VNodeProps
        & AllowedComponentProps
        & ComponentCustomProps
        & Omit<InputHTMLAttributes, 'id' | 'type' | keyof Prop>
        & Pick<Prop, 'modelValue'>
        & KebabCasedProperties<Omit<Prop, 'modelValue'>>
        & { 'onUpdate:modelValue'?: (value: string) => void; };
};
export type { Prop };
