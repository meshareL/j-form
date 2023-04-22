import type { InjectionKey, DeepReadonly, Ref } from 'vue';
import { Violation } from './support';
import type { ValidSize } from './support';

const enum ShareIdProvider {
    FORM,
    MASTHEAD,
    FORM_GROUP,
    CHOICE_GROUP,
    RADIO_GROUP,
    CHECKBOX_GROUP
}

type FetchShareId = {
    fetch: () => string;
    provider: ShareIdProvider;
};

const enum ValidationResult {
    /** 验证被禁用, novalidate = true */
    DISABLED,
    /** 不需要进行验证, 一般为表单控件没有约束条件, 如: pattern, min, max */
    UNREQUIRED,
    /** 未进行过验证 */
    UNVALIDATED,
    /** 验证发生异常 */
    EXCEPTION,
    SUCCEED,
    ERRORED
}

type ElementAction = {
    checkValidity: () => Promise<ValidationResult>;
    focus: () => Promise<void>;
    /**
     * 该元素是否是适合聚焦的对象
     *
     * 类似 Radio, Checkbox 类型的控件可能并不适合聚焦, 此时聚焦 Group 组件
     * 也许是个不错的选择
     *
     * @return 如果该表单控件是适合聚焦的对象则返回 true, 否则返回 false
     */
    isSuitableFocus: () => boolean;
};

type ValidationManager = {
    addAction: (action: ElementAction, id?: string) => void;
    removeAction: (id?: string) => void;
};

type ValidationStatusReporter = {
    start: () => void;
    passed: () => void;
    failed: (...violation: Violation[]) => void;
};

/*
 * 父组件需要保证注入的函数在表单控件组件每次调用时都会返回相同的 id
 *
 *      group.3
 *    ↓       ↓
 * control control
 *    ↓       ↓
 *   1, 1    2, 2
 */
const fetchShareIdKey = Symbol('fetch share id') as InjectionKey<FetchShareId>;

const inheritedSizeKey = Symbol('form inherited size') as InjectionKey<DeepReadonly<Ref<ValidSize>>>
    , inheritedDisabledKey = Symbol('form inherited disabled') as InjectionKey<DeepReadonly<Ref<boolean>>>
    , inheritedRequiredKey = Symbol('form inherited required') as InjectionKey<DeepReadonly<Ref<boolean>>>
    , inheritedNovalidateKey = Symbol('form inherited novalidate') as InjectionKey<DeepReadonly<Ref<boolean>>>;

// radio, checkbox
const inheritedNameKey = Symbol('form inherited name') as InjectionKey<DeepReadonly<Ref<string>>>;

const validationManagerKey = Symbol('form validation manager') as InjectionKey<ValidationManager>
    , validationStatusReporterKey = Symbol('validation status reporter') as InjectionKey<ValidationStatusReporter>;
// 对于无法自行完成验证的组件 ( 如: Checkbox ), 将验证任务委托给父组件
const delegateValidationKey = Symbol('delegate validation') as InjectionKey<() => Promise<void>>;

export {
    ShareIdProvider,
    ValidationResult,
    fetchShareIdKey,
    inheritedSizeKey,
    inheritedDisabledKey,
    inheritedRequiredKey,
    inheritedNovalidateKey,
    inheritedNameKey,
    validationManagerKey,
    validationStatusReporterKey,
    delegateValidationKey
};
export type {
    FetchShareId,
    ElementAction,
    ValidationManager,
    ValidationStatusReporter
};
