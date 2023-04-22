import { describe, it, beforeAll, afterAll, afterEach, expect, vitest } from 'vitest';
import { enableAutoUnmount, shallowMount, config } from '@vue/test-utils';
import {
    fetchShareIdKey,
    ShareIdProvider,
    validationManagerKey,
    validationStatusReporterKey,
    ValidationResult
} from '../src/key';
import type { ValidationManager } from '../src/key';
import { Violation } from '../src/support';
import Textarea from '../src/component/literal/textarea';

enableAutoUnmount(afterEach);

describe('Textarea component', () => {
    const defaultConfigProvide = config.global.provide
        , shareId = 'abc'
        , validationManager = {
        addAction: vitest.fn<Parameters<ValidationManager['addAction']>, ReturnType<ValidationManager['addAction']>>(),
        removeAction: vitest.fn<Parameters<ValidationManager['removeAction']>, ReturnType<ValidationManager['removeAction']>>()
    }
        , validationReporter = {
        start: vitest.fn(),
        passed: vitest.fn(),
        failed: vitest.fn()
    };

    beforeAll(() => {
        config.global.provide = {
            [fetchShareIdKey as symbol]: { fetch: () => shareId, provider: ShareIdProvider.FORM_GROUP },
            [validationManagerKey as symbol]: validationManager,
            [validationStatusReporterKey as symbol]: validationReporter
        };
    });

    afterAll(() => {
        config.global.provide = defaultConfigProvide;
    });

    it('create component', () => {
        const instance = shallowMount(Textarea as any);
        expect(validationManager.addAction).toBeCalled();
        expect(instance.exists()).toBe(true);
        expect(instance.classes('j-form-control')).toBe(true);
        expect(instance.element.nodeName).toBe('TEXTAREA');
        expect(instance.attributes()).not.toHaveProperty('aria-invalid');
        expect(instance.attributes()).not.toHaveProperty('aria-errormessage');
    });

    it('unmount component', () => {
        const instance = shallowMount(Textarea as any);
        expect(instance.exists()).toBe(true);

        instance.unmount();
        expect(validationManager.removeAction).toBeCalled();
    });

    describe('v-model directive', () => {
        describe('optional directive', () => {
            it('use directive', async () => {
                const instance = shallowMount(Textarea as any, {
                    props: {
                        modelValue: 'init',
                        'onUpdate:modelValue': (value: string) => instance.setProps({ modelValue: value })
                    }
                });
                expect(instance.exists()).toBe(true);

                await instance.get('textarea').setValue('text');
                expect(instance.props('modelValue')).toBe('text');
            });

            it('unused directive', async () => {
                const instance = shallowMount(Textarea as any);
                expect(instance.exists()).toBe(true);

                await instance.get('textarea').setValue('text');
                expect(instance.props('modelValue')).toBeUndefined();
            });
        });

        it('trim modifier', async () => {
            const instance = shallowMount(Textarea as any, {
                props: {
                    modelValue: 'init',
                    modelModifiers: { trim: true, lazy: false },
                    'onUpdate:modelValue': (value: string) => instance.setProps({ modelValue: value })
                }
            });
            expect(instance.exists()).toBe(true);

            await instance.get('textarea').setValue(' text ');
            expect(instance.props('modelValue')).toBe('text');
        });

        it('lazy modifier', async () => {
            const initText = 'init'
                , instance = shallowMount(Textarea as any, {
                props: {
                    modelValue: initText,
                    modelModifiers: { trim: false, lazy: true },
                    'onUpdate:modelValue': (value: string) => instance.setProps({ modelValue: value })
                }
            });
            expect(instance.exists()).toBe(true);

            const textarea = instance.get('textarea');

            textarea.element.value = 'text';
            await textarea.trigger('input');
            expect(instance.props('modelValue')).toBe(initText);

            await textarea.trigger('change');
            expect(instance.props('modelValue')).toBe('text');
        });

        it('trim and lazy modifier', async () => {
            const initText = 'init'
                , instance = shallowMount(Textarea as any, {
                props: {
                    modelValue: initText,
                    modelModifiers: { trim: true, lazy: true },
                    'onUpdate:modelValue': (value: string) => instance.setProps({ modelValue: value })
                }
            });
            expect(instance.exists()).toBe(true);

            const textarea = instance.get('textarea');

            textarea.element.value = ' text ';
            await textarea.trigger('input');
            expect(instance.props('modelValue')).toBe(initText);

            await textarea.trigger('change');
            expect(instance.props('modelValue')).toBe('text');
        });
    });

    describe('component prop', () => {
        it('required prop', async () => {
            const instance = shallowMount(Textarea as any, { props: { required: true } });
            expect(instance.attributes()).toHaveProperty('required');

            await instance.setProps({ required: false });
            expect(instance.attributes()).not.toHaveProperty('required');
        });

        it('novalidate prop', async () => {
            const instance = shallowMount(Textarea as any, { props: { novalidate: true } });
            expect(instance.exists()).toBe(true);

            const action = validationManager.addAction.mock.calls[0]?.[0];
            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.DISABLED);

            await instance.setProps({ novalidate: false });
            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.SUCCEED);
        });
    });

    describe('validation', () => {
        it('validation passed', async () => {
            const instance = shallowMount(Textarea as any, { props: { required: true } });
            expect(instance.exists()).toBe(true);

            instance.get('textarea').element.value = 'text';
            const action = validationManager.addAction.mock.calls[0]?.[0];

            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.SUCCEED);
            expect(validationReporter.start).toBeCalled();
            expect(validationReporter.passed).toBeCalled();
            expect(instance.attributes('aria-invalid')).toBe('false');
            expect(instance.attributes()).not.toHaveProperty('aria-errormessage');
        });

        it('validation failed', async () => {
            const instance = shallowMount(Textarea as any, { props: { required: true } });
            expect(instance.exists()).toBe(true);

            const action = validationManager.addAction.mock.calls[0]?.[0];

            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.ERRORED);
            expect(validationReporter.start).toBeCalled();
            expect(validationReporter.failed).toBeCalledWith(Violation.VALUE_MISSING);
            expect(instance.attributes('aria-invalid')).toBe('true');
            expect(instance.attributes('aria-errormessage')).toBe(`${shareId}_errormessage`);
        });
    });

    it('focus on oneself', async () => {
        const focus = vitest.fn()
            , instance = shallowMount(Textarea as any, { attrs: { focus } });
        expect(instance.exists()).toBe(true);

        const action = validationManager.addAction.mock.calls[0]?.[0];
        await action?.focus();

        expect(focus).toBeCalled();
    });
});
