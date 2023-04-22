import {
    defineComponent,
    h as createElement,
    ref,
    readonly,
    toRef,
    inject,
    watch
} from 'vue';
import type {
    PropType,
    VNodeProps,
    AllowedComponentProps,
    ComponentCustomProps,
    InputHTMLAttributes
} from 'vue';
import { ComponentStatus } from '../../support';
import {
    ValidationResult,
    fetchShareIdKey,
    inheritedNameKey,
    inheritedDisabledKey,
    delegateValidationKey
} from '../../key';
import { checkboxErrormessageId, checkboxGroupValidationStatusKey } from './key';
import { pushControlAction } from '../../helper/common';
import type { KebabCasedProperties } from 'type-fest';

type Prop = {
    modelValue?: boolean | string[];
    name?: string;
    value: string;
    disabled?: boolean;
    /**
     * 未使用 v-model 指令时, 指定 checkbox 默认选中状态
     *
     * @default false
     */
    defaultChecked?: boolean;
};

const component = defineComponent({
    name: 'JCheckbox',
    inheritAttrs: true,
    props: {
        modelValue: {
            type: [ Boolean, Array ] as PropType<boolean | string[]>,
            required: false,
            default: undefined
        },
        name: {
            type: String,
            required: false
        },
        value: {
            type: String,
            required: true
        },
        disabled: {
            type: Boolean,
            required: false,
            default: false
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
            , shareId = inject(fetchShareIdKey, null)?.fetch()
            , errormessageId = inject(checkboxErrormessageId, null)
            , validationStatus = inject(
            checkboxGroupValidationStatusKey,
            () => readonly(ref(ComponentStatus.INITIALIZED)), true
        )
            , isDisabled = inject(inheritedDisabledKey, () => readonly(toRef(props, 'disabled')), true)
            , checkboxName = inject(inheritedNameKey, () => readonly(toRef(props, 'name')), true);

        const inputChecked = ref(props.defaultChecked);

        watch(() => props.modelValue, value => {
            if (value === undefined) {
                return;
            }

            if (Array.isArray(value)) {
                inputChecked.value = value.includes(props.value);
            } else {
                inputChecked.value = value;
            }
        }, { immediate: true });

        const delegateValidation = inject(delegateValidationKey, null);

        function onChange(event: Event): void {
            const input = event.target;
            if (!(input instanceof HTMLInputElement)) return;

            const checked = input.checked;
            inputChecked.value = checked;

            if (typeof props.modelValue === 'boolean') {
                emit('update:modelValue', checked);

            } else if (Array.isArray(props.modelValue)) {
                let copied = Array.from(props.modelValue);

                if (checked) {
                    copied.push(props.value);
                } else {
                    copied = copied.filter(value => value !== props.value);
                }

                emit('update:modelValue', copied);
            }

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

            return Promise.resolve(input.checked ? ValidationResult.SUCCEED : ValidationResult.ERRORED);
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
                type: 'checkbox',
                name: checkboxName.value,
                value: props.value,
                checked: inputChecked.value,
                disabled: isDisabled.value,
                onChange
            };

            switch (validationStatus.value) {
                case ComponentStatus.VALIDATION_SUCCEED: {
                    data['aria-invalid'] = false;
                    break;
                }
                case ComponentStatus.VALIDATION_ERRORED:
                case ComponentStatus.VALIDATION_EXCEPTION: {
                    data['aria-invalid'] = true;
                    data['aria-errormessage'] = errormessageId;
                    break;
                }
            }

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
        & { 'onUpdate:modelValue'?: (value: boolean | string[]) => void; };
};
export type { Prop };
