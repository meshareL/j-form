import { afterEach, describe, expect, it, beforeAll, afterAll, vitest } from 'vitest';
import { enableAutoUnmount, shallowMount, config, mount } from '@vue/test-utils';
import type { FunctionalComponent } from 'vue';
import { h as createElement, inject, readonly, ref } from 'vue';
import {
    delegateValidationKey,
    fetchShareIdKey,
    inheritedDisabledKey,
    inheritedNameKey,
    ShareIdProvider,
    validationManagerKey,
    ValidationResult,
    validationStatusReporterKey,
    inheritedNovalidateKey
} from '../src/key';
import type { ValidationManager } from '../src/key';
import { Violation } from '../src/support';
import RadioGroup from '../src/component/radio/radio-group';

enableAutoUnmount(afterEach);

const checkedChild: FunctionalComponent = () => {
    const manager = inject(validationManagerKey, null);

    function checkValidity(): Promise<ValidationResult> {
        return Promise.resolve(ValidationResult.SUCCEED);
    }

    manager?.addAction({
        checkValidity,
        isSuitableFocus: () => false,
        focus: () => Promise.reject()
    }, '0');

    return createElement('input', { type: 'radio', checked: true });
}
    , uncheckedChild: FunctionalComponent = () => {
    const manager = inject(validationManagerKey, null);

    function checkValidity(): Promise<ValidationResult> {
        return Promise.resolve(ValidationResult.ERRORED);
    }

    manager?.addAction({
        checkValidity,
        isSuitableFocus: () => false,
        focus: () => Promise.reject()
    }, '1');

    return createElement('input', { type: 'radio', checked: false });
}
    , exceptionChild: FunctionalComponent = () => {
    const manager = inject(validationManagerKey, null);

    function checkValidity(): Promise<ValidationResult> {
        return Promise.reject();
    }

    manager?.addAction({
        checkValidity,
        isSuitableFocus: () => false,
        focus: () => Promise.reject()
    }, '2');

    return createElement('input', { type: 'radio', checked: false });
};

describe('RadioGroup component', () => {
    const defaultConfigProvide = config.global.provide
        , shareId = '0'
        , validationManager = {
        addAction: vitest.fn<Parameters<ValidationManager['addAction']>, ReturnType<ValidationManager['addAction']>>(),
        removeAction: vitest.fn<Parameters<ValidationManager['removeAction']>, ReturnType<ValidationManager['removeAction']>>()
    }
        , validationStatusReporter = {
        start: vitest.fn(),
        passed: vitest.fn(),
        failed: vitest.fn()
    }

    beforeAll(() => {
        config.global.provide = {
            [fetchShareIdKey as symbol]: { fetch: () => shareId, provider: ShareIdProvider.FORM_GROUP },
            [validationManagerKey as symbol]: validationManager,
            [validationStatusReporterKey as symbol]: validationStatusReporter
        };
    });

    afterAll(() => {
        config.global.provide = defaultConfigProvide;
    });

    it('create component', () => {
        const instance = shallowMount(RadioGroup as any);

        expect(instance.exists()).toBe(true);
        expect(instance.classes('j-form-radio-group')).toBe(true);
        expect(instance.classes()).not.toEqual(
            expect.arrayContaining([ 'is-valid', 'is-invalid' ])
        );
        expect(instance.attributes('aria-orientation')).toBe('vertical');
        expect(instance.attributes('aria-disabled')).toBe('false');
        expect(instance.attributes('tabindex')).toBe('-1');
        expect(instance.attributes('role')).toBe('radiogroup');
        expect(validationManager.addAction).toBeCalled();
    });

    it('unmount component', () => {
        const instance = shallowMount(RadioGroup as any);
        expect(instance.exists()).toBe(true);

        instance.unmount();
        expect(validationManager.removeAction).toBeCalled();
    });

    it('RadioGroup components should provide dependencies for subcomponents', () => {
        const child: FunctionalComponent = () => {
            const fetchShareId = inject(fetchShareIdKey, null);
            expect(fetchShareId?.fetch()).not.toBeUndefined();
            expect(fetchShareId?.provider).toBe(ShareIdProvider.RADIO_GROUP);

            expect(inject(inheritedNameKey, null)?.value).toBe('0');
            expect(inject(inheritedDisabledKey, null)?.value).toBe(true);
            expect(inject(delegateValidationKey, null)).toBeInstanceOf(Function);
            return 'Child';
        };

        const instance = mount(RadioGroup as any, {
            props: { name: '0', disabled: true },
            slots: { default: () => createElement(child) }
        });
        expect(instance.exists()).toBe(true);
    });

    describe('prop', () => {
        it('disabled', async () => {
            const instance = shallowMount(RadioGroup as any, { props: { disabled: true } });
            expect(instance.attributes('aria-disabled')).toBe('true');

            await instance.setProps({ disabled: false });
            expect(instance.attributes('aria-disabled')).toBe('false');
        });

        it('orientation', async () => {
            const instance = shallowMount(RadioGroup as any, { props: { orientation: 'horizontal' } });
            expect(instance.attributes('aria-orientation')).toBe('horizontal');

            await instance.setProps({ orientation: 'vertical' });
            expect(instance.attributes('aria-orientation')).toBe('vertical');
        });
    });

    it('parent novalidate', async () => {
        const instance = shallowMount(RadioGroup as any, {
            props: { novalidate: false },
            global: { provide: { [inheritedNovalidateKey as symbol]: readonly(ref(true)) } }
        });
        expect(instance.exists()).toBe(true);

        const action = validationManager.addAction.mock.calls[0]?.[0];
        await expect(action?.checkValidity()).resolves.toBe(ValidationResult.DISABLED);
    });

    describe('validation', () => {
        it('validation passed', async () => {
            const instance = mount(RadioGroup as any, {
                slots: { default: () => [ createElement(checkedChild) ] }
            });

            const action = validationManager.addAction.mock.calls[0]?.[0];
            await action?.checkValidity();

            expect(validationStatusReporter.start).toBeCalled();
            expect(validationStatusReporter.passed).toBeCalled();
            expect(instance.attributes('aria-invalid')).toBe('false');
            expect(instance.attributes('aria-errormessage')).toBeUndefined();
        });

        it('validation failed', async () => {
            const instance = mount(RadioGroup as any, {
                slots: { default: () => createElement(uncheckedChild) }
            });

            const action = validationManager.addAction.mock.calls[0]?.[0];
            await action?.checkValidity();

            expect(validationStatusReporter.start).toBeCalled();
            expect(validationStatusReporter.failed).toBeCalledWith(Violation.VALUE_MISSING);
            expect(instance.attributes('aria-invalid')).toBe('true');
            expect(instance.attributes('aria-errormessage')).toBe(`${shareId}_errormessage`);
        });

        it('validation exception', async () => {
            mount(RadioGroup as any, {
                slots: { default: () => createElement(exceptionChild) }
            });

            const action = validationManager.addAction.mock.calls[0]?.[0];

            await expect(action?.checkValidity()).rejects.toThrow();
            expect(validationStatusReporter.start).toBeCalled();
        });
    });

    it('focus on oneself', async () => {
        const onFocus = vitest.fn();

        mount(RadioGroup as any, {
            attrs: { focus: onFocus },
            slots: { default: () => createElement(checkedChild) }
        });

        const action = validationManager.addAction.mock.calls[0]?.[0];
        await action?.focus();

        expect(onFocus).toBeCalled();
    });
});
