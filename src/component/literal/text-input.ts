import {
    defineComponent,
    h as createElement,
    inject,
    ref,
    toRef,
    readonly,
    watch,
    nextTick
} from 'vue';
import type {
    PropType,
    VNodeProps,
    AllowedComponentProps,
    ComponentCustomProps,
    InputHTMLAttributes
} from 'vue';
import {
    ValidationResult,
    fetchShareIdKey,
    inheritedRequiredKey,
    inheritedNovalidateKey
} from '../../key';
import { validSizes } from '../../support';
import type { ValidSize } from '../../support';
import { debounce } from 'throttle-debounce';
import { pushControlAction, inferComponentStatus } from '../../helper/common';
import { imeHelper, checkValidityHelper } from './helper';
import type { KebabCasedProperties } from 'type-fest';
import { ComponentStatus } from '../../support';
import { propOption as commonPropOption } from './common';
import type { Prop as CommonProp } from './common';

type Prop = CommonProp & {
    modelModifiers?: { lazy: boolean, trim: boolean };
    type?: 'email' | 'search' | 'tel' | 'text';
    size?: ValidSize;
    revalidate?: (value: string) => Promise<boolean>;
};

const validTypes = [
    'email',
    'search',
    'tel',
    'text',
];

const component = defineComponent({
    name: 'JTextInput',
    inheritAttrs: true,
    props: {
        ...commonPropOption,
        modelModifiers: {
            type: Object as PropType<{ lazy?: boolean, trim?: boolean }>,
            required: false,
            default: () => ({ lazy: false, trim: false })
        },
        type: {
            type: String as PropType<'email' | 'search' | 'tel' | 'text'>,
            required: false,
            default: 'text',
            validator: (value: string) => validTypes.includes(value)
        },
        size: {
            type: String as PropType<ValidSize>,
            required: false,
            default: 'medium',
            validator: (value: string) => validSizes.includes(value)
        },
        revalidate: {
            type: Function as PropType<(value: string) => Promise<boolean>>,
            required: false
        }
    },
    emits: [ 'update:modelValue' ],
    setup(props, { emit }) {
        const inputRef = ref<HTMLInputElement | null>(null)
            , shareId = inject(fetchShareIdKey, null)?.fetch()
            , errormessageId = shareId?.concat('_errormessage')
            , isRequired = inject(inheritedRequiredKey, () => readonly(toRef(props, 'required')), true)
            , { status: selfStatus, infer } = inferComponentStatus()
            , { isComposing, onCompositionstart, onCompositionend } = imeHelper();

        const inputValue = ref(props.modelValue ?? '');

        watch(() => props.modelValue, value => {
            if (value === undefined
                || inputValue.value === value
                || inputValue.value.trim() === value) {
                return;
            }

            inputValue.value = value;
        }, { immediate: true });

        function syncAndEmitInputValue(event: Event): void {
            if (isComposing.value) return;

            const input = event.target;
            if (!(input instanceof HTMLInputElement)) return;

            inputValue.value = input.value;

            let shouldEmit = true;
            const emitText = props.modelModifiers?.trim
                ? input.value.trim()
                : input.value;

            if (event.type === 'input') {
                shouldEmit = !props.modelModifiers?.lazy;
            } else if (event.type === 'change') {
                inputValue.value = emitText;
            } else {
                return;
            }

            shouldEmit && emit('update:modelValue', emitText);
        }

        const novalidate = inject(inheritedNovalidateKey, () => readonly(toRef(props, 'novalidate')), true)
            , _checkValidity = checkValidityHelper({
            novalidate,
            isComposing,
            elementRef: inputRef
        });

        async function checkValidity(): Promise<ValidationResult> {
            let result: ValidationResult;
            try {
                if (props.revalidate) {
                    result = await _checkValidity(props.revalidate.bind(null, inputValue.value));
                } else {
                    result = await _checkValidity();
                }
            } catch (e) {
                result = ValidationResult.EXCEPTION;
            }

            infer(result);
            return result;
        }

        function focus(): Promise<void> {
            return nextTick(() => {
                const input = inputRef.value;
                if ((!(input instanceof HTMLInputElement))) {
                    return Promise.reject();
                }

                input.focus();
            });
        }

        pushControlAction({
            checkValidity,
            focus,
            isSuitableFocus: () => true
        }, shareId);

        const onInputCheckValidity = debounce(300, () => {
            if (isComposing.value) return;
            checkValidity().catch(() => {/* Don't do anything. */});
        });

        return () => {
            const classes = [
                'j-form-control',
                {
                    'input-sm': props.size === 'small',
                    'input-lg': props.size === 'large'
                }
            ]
                , data: Record<string, unknown> = {
                ref: inputRef,
                id: shareId,
                class: classes,
                value: inputValue.value,
                required: isRequired.value,
                type: props.type,
                onCompositionstart,
                onCompositionend,
                onInput: [ syncAndEmitInputValue, onInputCheckValidity ],
                onChange: [ syncAndEmitInputValue, onInputCheckValidity ]
            };

            switch (selfStatus.value) {
                case ComponentStatus.VALIDATION_SUCCEED: {
                    data['aria-invalid'] = false;
                    break;
                }
                case ComponentStatus.VALIDATION_EXCEPTION:
                case ComponentStatus.VALIDATION_ERRORED: {
                    data['aria-invalid'] = true;
                    data['aria-errormessage'] = errormessageId;
                    break;
                }
            }

            return createElement('input', data);
        };
    }
});

/**
 * 文本输入框
 *
 * 该组件支持 v-model 指令, 并且支持 .lazy 和 .trim 修饰符
 *
 * 该组件仅支持有限的 {@link validTypes 类型}, 如果需要其他类型的
 * 输入框, 请使用该类型对应的专用组件
 *
 * `revalidate` 验证只有在客户端验证通过后才会触发
 */
export default component as new() => {
    $props:
        VNodeProps
        & AllowedComponentProps
        & ComponentCustomProps
        & Omit<InputHTMLAttributes, 'id' | keyof Prop>
        & Pick<Prop, 'modelValue' | 'modelModifiers'>
        & KebabCasedProperties<Omit<Prop, 'modelValue' | 'modelModifiers'>>
        & { 'onUpdate:modelValue'?: (value: string) => void; };
};

export type { Prop };
