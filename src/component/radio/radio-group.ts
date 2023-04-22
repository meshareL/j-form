import {
    defineComponent,
    h as createElement,
    provide,
    inject,
    readonly,
    ref,
    toRef,
    nextTick
} from 'vue';
import type {
    PropType,
    VNodeProps,
    AllowedComponentProps,
    ComponentCustomProps,
    HTMLAttributes,
    VNode
} from 'vue';
import {
    ShareIdProvider,
    ValidationResult,
    fetchShareIdKey,
    inheritedNameKey,
    inheritedNovalidateKey,
    delegateValidationKey,
    inheritedDisabledKey,
    inheritedRequiredKey,
    validationStatusReporterKey
} from '../../key';
import { ComponentStatus, Violation } from '../../support';
import {
    collectControlAction,
    pushControlAction,
    inferComponentStatus
} from '../../helper/common';

type Prop = {
    novalidate?: boolean;
    disabled?: boolean;
    // radio name
    name?: string;
    // https://www.w3.org/TR/wai-aria-1.2/#aria-orientation
    orientation?: 'horizontal' | 'vertical';
};

const component = defineComponent({
    name: 'JRadioGroup',
    inheritAttrs: true,
    props: {
        novalidate: {
            type: Boolean,
            required: false,
            default: false
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
        orientation: {
            type: String as PropType<'horizontal' | 'vertical'>,
            required: false,
            default: 'vertical'
        }
    },
    setup(props, { slots }) {
        let shareIdFetchTime = 0;
        const shareId = inject(fetchShareIdKey, null)?.fetch()
            , errormessageId = shareId?.concat('_errormessage')
            , mastheadId = shareId?.concat('_masthead')
            , radioGroupRef = ref<HTMLDivElement>()
            , novalidate = inject(inheritedNovalidateKey, () => readonly(toRef(props, 'novalidate')), true)
            , isRequired = inject(inheritedRequiredKey, () => readonly(ref(false)), true)
            , { status: selfStatus, infer } = inferComponentStatus();

        const validationStatusReporter = inject(validationStatusReporterKey, null)
            , validationActions = collectControlAction();

        async function checkValidity(): Promise<ValidationResult> {
            validationStatusReporter?.start();

            if (novalidate.value) {
                infer(ValidationResult.DISABLED);
                validationStatusReporter?.passed();
                return ValidationResult.DISABLED;
            }

            try {
                for (const action of validationActions.values()) {
                    const result = await action.checkValidity();
                    if (result === ValidationResult.SUCCEED) {
                        infer(ValidationResult.SUCCEED);
                        validationStatusReporter?.passed();
                        return ValidationResult.SUCCEED;
                    }
                }
            } catch (e) {
                infer(ValidationResult.EXCEPTION);
                throw new Error('An error occurred while the RadioGroup component was validating.');
            }

            infer(ValidationResult.ERRORED);
            validationStatusReporter?.failed(Violation.VALUE_MISSING);
            return ValidationResult.ERRORED;
        }

        function focus(): Promise<void> {
            return nextTick(() => {
                const radioGroup = radioGroupRef.value;
                if (!(radioGroup instanceof HTMLDivElement)) {
                    return Promise.reject();
                }

                radioGroup.focus();
            });
        }

        pushControlAction({
            checkValidity,
            focus,
            isSuitableFocus: () => true
        }, shareId);

        provide(fetchShareIdKey, {
            fetch: () => shareId?.concat(`_${++shareIdFetchTime}`),
            provider: ShareIdProvider.RADIO_GROUP
        });
        provide(inheritedNameKey, readonly(toRef(props, 'name')));
        provide(inheritedDisabledKey, readonly(toRef(props, 'disabled')));
        provide(delegateValidationKey, () => checkValidity().catch(() => {/* Don't do anything */}));

        return () => {
            const data: Record<string, unknown> = {
                ref: radioGroupRef,
                id: shareId,
                class: 'j-form-radio-group',
                tabindex: -1,
                role: 'radiogroup',
                'aria-labelledby': mastheadId,
                'aria-disabled': props.disabled,
                'aria-required': isRequired.value,
                'aria-orientation': props.orientation
            };

            if (selfStatus.value !== ComponentStatus.INITIALIZED) {
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
            }

            return createElement('div', data, slots['default']?.());
        };
    }
});

/**
 * 单选按钮组容器, 可以使用该组件 `name` 属性统一设置所有 `Radio` 组件的 `name` 属性值
 *
 * 该组件验证未通过时会抛出 {@link Violation.VALUE_MISSING VALUE_MISSING} 错误
 *
 * @example
 * <FormGroup>
 *   <template #valid-feedback>Ok</template>
 *   <template #invalid-feedback>A sport must be chosen</template>
 *   <Masthead>
 *     <Caption>Sport</Caption>
 *     <Summary>Please select the sport you like</Summary>
 *   </Masthead>
 *   <RadioGroup name="ball" orientation="vertical">
 *     <ChoiceGroup>
 *       <Radio value="football"/>
 *       <Label>Football</Label>
 *     </ChoiceGroup>
 *     <ChoiceGroup>
 *       <Radio value="basketball"/>
 *       <Label>BasketBall</Label>
 *     </ChoiceGroup>
 *   </RadioGroup>
 * </FormGroup>
 */
export default component as new() => {
    $props:
        VNodeProps
        & AllowedComponentProps
        & ComponentCustomProps
        & Omit<HTMLAttributes, keyof Prop>
        & Prop;

    $slots: {
        default?: () => VNode[];
    }
};
export type { Prop };
