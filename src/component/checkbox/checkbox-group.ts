import {
    defineComponent,
    h as createElement,
    inject,
    ref,
    readonly,
    toRef,
    provide,
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
import { Violation } from '../../support';
import {
    ShareIdProvider,
    ValidationResult,
    fetchShareIdKey,
    delegateValidationKey,
    inheritedNovalidateKey,
    inheritedNameKey,
    inheritedDisabledKey,
    validationStatusReporterKey
} from '../../key';
import { checkboxErrormessageId, checkboxGroupValidationStatusKey } from './key';
import {
    collectControlAction,
    pushControlAction,
    inferComponentStatus
} from '../../helper/common';

type Prop = {
    novalidate?: boolean;
    minimum?: number;
    maximum?: number;
    disabled?: boolean;
    // checkbox name
    name?: string;
    // https://www.w3.org/TR/wai-aria-1.2/#aria-orientation
    orientation?: 'horizontal' | 'vertical';
};

const component = defineComponent({
    name: 'JCheckboxGroup',
    inheritAttrs: true,
    props: {
        novalidate: {
            type: Boolean,
            required: false,
            default: false
        },
        minimum: {
            type: Number,
            required: false,
            default: Number.NEGATIVE_INFINITY
        },
        maximum: {
            type: Number,
            required: false,
            default: Number.POSITIVE_INFINITY
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
            , checkboxGroupRef = ref<HTMLDivElement>()
            , novalidate = inject(inheritedNovalidateKey, () => readonly(toRef(props, 'novalidate')), true)
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

            const checkStatuses: boolean[] = [];

            try {
                for (const action of validationActions.values()) {
                    const result = await action.checkValidity();
                    if (result === ValidationResult.SUCCEED) {
                        checkStatuses.push(true);
                    } else if (result === ValidationResult.ERRORED) {
                        checkStatuses.push(false);
                    }
                }
            } catch (e) {
                infer(ValidationResult.EXCEPTION);
                throw new Error('An error occurred while the CheckboxGroup component was validating.');
            }

            const count = checkStatuses.filter(value => value).length
                , status = count >= props.minimum && count <= props.maximum;

            if (status) {
                infer(ValidationResult.SUCCEED);
                validationStatusReporter?.passed();
            } else {
                const violation = count > props.maximum
                    ? Violation.RANGE_OVERFLOW
                    : Violation.RANGE_UNDERFLOW;
                infer(ValidationResult.ERRORED);
                validationStatusReporter?.failed(violation);
            }

            return Promise.resolve(status ? ValidationResult.SUCCEED : ValidationResult.ERRORED);
        }

        function focus(): Promise<void> {
            return nextTick(() => {
                const checkboxGroup = checkboxGroupRef.value;
                if (!(checkboxGroup instanceof HTMLDivElement)) {
                    return Promise.reject();
                }

                checkboxGroup.focus();
            });
        }

        pushControlAction({
            checkValidity,
            focus,
            isSuitableFocus: () => true
        }, shareId);

        provide(fetchShareIdKey, {
            fetch: () => shareId?.concat(`_${++shareIdFetchTime}`),
            provider: ShareIdProvider.CHECKBOX_GROUP
        });
        provide(inheritedNameKey, readonly(toRef(props, 'name')));
        provide(inheritedDisabledKey, readonly(toRef(props, 'disabled')));
        provide(delegateValidationKey, () => checkValidity().catch(() => {/* Don't do anything */}));
        provide(checkboxErrormessageId, errormessageId);
        provide(checkboxGroupValidationStatusKey, readonly(selfStatus));

        return () => {
            const classes = [
                'j-form-checkbox-group',
                `orientation-${props.orientation}`
            ]
                , data: Record<string, unknown> = {
                ref: checkboxGroupRef,
                id: shareId,
                class: classes,
                tabindex: -1,
                role: 'group',
                'aria-disabled': props.disabled
            };

            return createElement('div', data, slots['default']?.());
        };
    }
});

/**
 * 复选框容器, 可以使用该组件 `name` 属性统一设置所有 `Checkbox` 组件的 `name` 属性值
 *
 * 该组件验证未通过时会抛出 {@link Violation.RANGE_UNDERFLOW RANGE_UNDERFLOW}
 * 和 {@link Violation.RANGE_OVERFLOW RANGE_OVERFLOW} 错误
 *
 * @example
 * ```vue
 * <FormGroup required>
 *     <template valid-feedback>Ok</template>
 *     <template invalid-feedback="{ contain, containAny }">Error</template>
 *     <Masthead>
 *         <Caption>Caption</Caption>
 *         <Summary>Summary</Summary>
 *     </Masthead>
 *     <CheckboxGroup name="ball" :minimum="1" :maximum="2">
 *         <ChoiceGroup>
 *             <Checkbox value="football"/>
 *             <Label>Football</Label>
 *         </ChoiceGroup>
 *         <ChoiceGroup>
 *             <Checkbox value="basketball"/>
 *             <Label>Basketball</Label>
 *         </ChoiceGroup>
 *         <ChoiceGroup>
 *             <Checkbox value="baseball"/>
 *             <Label>Baseball</Label>
 *         </ChoiceGroup>
 *     </CheckboxGroup>
 * </FormGroup>
 * ```
 */
export default component as new() => {
    $props:
        VNodeProps
        & AllowedComponentProps
        & ComponentCustomProps
        & Omit<HTMLAttributes, keyof Prop>
        & Prop;

    $slots: {
        default?: () => VNode[]
    }
};
export type { Prop };
