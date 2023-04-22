import { describe, it, afterEach, expect, beforeAll, afterAll, vitest } from 'vitest';
import { shallowMount, enableAutoUnmount, config } from '@vue/test-utils';
import { readonly, ref } from 'vue';
import {
    fetchShareIdKey,
    inheritedNovalidateKey,
    inheritedRequiredKey,
    validationManagerKey,
    validationStatusReporterKey,
    ShareIdProvider,
    ValidationResult
} from '../src/key';
import type { ValidationManager } from '../src/key';
import { Violation } from '../src';
import TextInput from '../src/component/literal/text-input';

enableAutoUnmount(afterEach);

vitest.mock('throttle-debounce', async () => {
    const actual = await vitest.importActual<typeof import('throttle-debounce')>('throttle-debounce');

    const debounce = vitest.fn((_, callback: Function) => {
        const fun = (...args: any[]) => callback.apply(this, args);
        fun.cancel = () => undefined;
        return fun;
    });

    return { __esModule: true, ...actual, debounce };
});

describe('TextInput component', () => {
    const defaultConfigProvide = config.global.provide
        , shareId = 'abcdef'
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
        const instance = shallowMount(TextInput as any);
        expect(validationManager.addAction).toBeCalled();
        expect(instance.exists()).toBe(true);
        expect(instance.classes('j-form-control')).toBe(true);
        expect(instance.attributes('type')).toBe('text');
        expect(instance.attributes()).not.toHaveProperty('aria-invalid');
        expect(instance.attributes()).not.toHaveProperty('aria-errormessage');
    });

    it('unmount component', () => {
        const instance = shallowMount(TextInput as any);
        expect(instance.exists()).toBe(true);

        instance.unmount();
        expect(validationManager.removeAction).toBeCalled();
    });

    describe('v-mode directive', () => {
        describe('optional v-model', () => {
            it('use directive', async () => {
                const instance = shallowMount(TextInput as any, {
                    props: {
                        modelValue: 'initial text',
                        'onUpdate:modelValue': (value: string) => instance.setProps({ modelValue: value })
                    }
                });

                expect(instance.exists()).toBe(true);

                await instance.get('input').setValue('text');
                expect(instance.props('modelValue')).toBe('text');
            });

            it('unused directive', async () => {
                const instance = shallowMount(TextInput as any);
                expect(instance.exists()).toBe(true);

                await instance.get('input').setValue('text');
                expect(instance.props('modelValue')).toBeUndefined();
            });
        });

        it('v-model trim modifier', async () => {
            const instance = shallowMount(TextInput as any, {
                props: {
                    modelValue: 'init',
                    modelModifiers: { trim: true, lazy: false },
                    'onUpdate:modelValue': (value: string) => instance.setProps({ modelValue: value })
                }
            });
            expect(instance.exists()).toBe(true);

            await instance.get('input').setValue(' text ');
            expect(instance.props('modelValue')).toBe('text');
        });

        it('v-model lazy modifier', async () => {
            const initText = 'init'
                , instance = shallowMount(TextInput as any, {
                props: {
                    modelValue: initText,
                    modelModifiers: { trim: false, lazy: true },
                    'onUpdate:modelValue': (value: string) => instance.setProps({ modelValue: value })
                }
            });
            expect(instance.exists()).toBe(true);

            const input = instance.get('input');
            // setValue 方法会自动触发 input 与 change 两个事件
            // 所以手动触发这两个事件, 测试 lazy 修饰符
            // https://github.com/vuejs/test-utils/blob/v2.2.4/src/domWrapper.ts#L122
            input.element.value = 'text';
            await input.trigger('input');
            expect(instance.props('modelValue')).toBe(initText);

            input.element.value = 'text';
            await input.trigger('change');
            expect(instance.props('modelValue')).toBe('text');
        });

        it('v-model uses both trim and lazy modifier', async () => {
            const initText = 'init'
                , instance = shallowMount(TextInput as any, {
                props: {
                    modelValue: initText,
                    modelModifiers: { trim: true, lazy: true },
                    'onUpdate:modelValue': (value: string) => instance.setProps({ modelValue: value })
                }
            });
            expect(instance.exists()).toBe(true);

            const input = instance.get('input');

            input.element.value = '  text  ';
            await input.trigger('input');
            expect(instance.props('modelValue')).toBe(initText);

            input.element.value = '  text  ';
            await input.trigger('change');
            expect(instance.props('modelValue')).toBe('text');
        });
    });

    describe('component prop', () => {
        it('type only supports a limited number of values', async () => {
            const instance = shallowMount(TextInput as any);
            expect(instance.exists()).toBe(true);

            const validator = instance.vm.$options.props.type.validator;
            for (const type of [ 'email', 'search', 'tel', 'text', 'radio' ]) {
                if (type === 'radio') {
                    expect(validator(type)).toBe(false);
                    continue;
                }

                 expect(validator(type)).toBe(true);
            }
        });

        it('required prop', async () => {
            const instance = shallowMount(TextInput as any, { props: { required: true } });
            expect(instance.attributes('required')).not.toBeUndefined();

            await instance.setProps({ required: false });
            expect(instance.attributes('required')).toBeUndefined();
        });

        it('size prop', async () => {
            const instance = shallowMount(TextInput as any, { props: { size: 'small' } });
            expect(instance.classes('input-sm')).toBe(true);
            expect(instance.classes('input-lg')).toBe(false);

            await instance.setProps({ size: 'medium' });
            expect(instance.classes('input-sm')).toBe(false);
            expect(instance.classes('input-lg')).toBe(false);

            await instance.setProps({ size: 'large' });
            expect(instance.classes('input-sm')).toBe(false);
            expect(instance.classes('input-lg')).toBe(true);

            const validator = instance.vm.$options.props.size.validator;
            for (const size of [ 'small', 'medium', 'large', 'xl' ]) {
                if (size === 'xl') {
                    expect(validator(size)).toBe(false);
                    continue;
                }

                expect(validator(size)).toBe(true);
            }
        });
    });

    it("use the 'id' provided by the parent component", () => {
        const instance = shallowMount(TextInput as any);
        expect(instance.attributes('id')).toBe(shareId);
    });

    it("the 'required' provided by the parent component is preferred", () => {
        const instance = shallowMount(TextInput as any, {
            props: { required: true },
            global: {
                provide: { [inheritedRequiredKey as symbol]: readonly(ref(false)) }
            }
        });

        expect(instance.attributes()).not.toHaveProperty('required');
    });

    describe('input IME', () => {
        it('the input event is not triggered during input', async () => {
            const instance = shallowMount(TextInput as any);
            expect(instance.exists()).toBe(true);

            const input = instance.get('input');
            await input.trigger('compositionstart', { data: 'E' });
            await input.trigger('input');
            expect(instance.emitted('update:modelValue')).toBeUndefined();
        });

        it('the input event is triggered after the input is complete', async () => {
            const instance = shallowMount(TextInput as any);
            expect(instance.exists()).toBe(true);

            const input = instance.get('input');
            input.element.value = 'text';
            await input.trigger('compositionstart', { data: 'E' });
            await input.trigger('compositionend', { data: 'E' });
            expect(instance.emitted('update:modelValue')).toHaveLength(1);
            expect(instance.emitted('update:modelValue')![0]).toStrictEqual([ 'text' ]);
        });
    });

    describe('validation', () => {
        it.skip('validating', async () => {
            const instance = shallowMount(TextInput as any, { props: { required: false } });
            expect(instance.exists()).toBe(true);

            await instance.get('input').setValue('text');
        });

        it('validation passed', async () => {
            const instance = shallowMount(TextInput as any, { props: { required: true } });
            expect(instance.exists()).toBe(true);

            instance.get('input').element.value = 'text';
            const action = validationManager.addAction.mock.calls[0]?.[0];

            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.SUCCEED);
            expect(validationReporter.start).toBeCalled();
            expect(validationReporter.passed).toBeCalled();
            expect(instance.attributes('aria-invalid')).toBe('false');
            expect(instance.attributes()).not.toHaveProperty('aria-errormessage');
        });

        it('validation failed', async () => {
            const instance = shallowMount(TextInput as any, { props: { required: true } });
            expect(instance.exists()).toBe(true);

            instance.get('input').element.value = '';
            const action = validationManager.addAction.mock.calls[0]?.[0];

            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.ERRORED);
            expect(validationReporter.start).toBeCalled();
            expect(validationReporter.failed).toBeCalled();
            expect(instance.attributes('aria-invalid')).toBe('true');
            expect(instance.attributes('aria-errormessage')).toBe(`${shareId}_errormessage`);
        });

        it('parent component disables validation', async () => {
            const instance = shallowMount(TextInput as any, {
                props: { required: true, novalidate: false },
                global: {
                    provide: { [inheritedNovalidateKey as symbol]: readonly(ref(true)) }
                }
            });
            expect(instance.exists()).toBe(true);

            const action = validationManager.addAction.mock.calls[0]?.[0];

            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.DISABLED);
            expect(validationReporter.start).not.toBeCalled();
            expect(validationReporter.passed).not.toBeCalled();
            expect(validationReporter.failed).not.toBeCalled();
            expect(instance.attributes()).not.toHaveProperty('aria-invalid');
            expect(instance.attributes()).not.toHaveProperty('aria-errormessage');
        });

        it('revalidate passed', async () => {
            const revalidateFun = vitest.fn().mockImplementation(() => Promise.resolve(true));

            const instance = shallowMount(TextInput as any, {
                props: {
                    required: true,
                    revalidate: revalidateFun
                }
            });
            expect(instance.exists()).toBe(true);

            instance.get('input').element.value = 'text';
            const action = validationManager.addAction.mock.calls[0]?.[0];

            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.SUCCEED);
            expect(validationReporter.start).toBeCalled();
            expect(validationReporter.passed).toBeCalled();
            expect(revalidateFun).toBeCalled();
            expect(instance.attributes('aria-invalid')).toBe('false');
            expect(instance.attributes()).not.toHaveProperty('aria-errormessage');
        });

        it('revalidate failed', async () => {
            const revalidateFun = vitest.fn().mockImplementation(() => Promise.resolve(false))
                , instance = shallowMount(TextInput as any, {
                props: {
                    required: true,
                    revalidate: revalidateFun
                }
            });
            expect(instance.exists()).toBe(true);

            instance.get('input').element.value = 'text';
            const action = validationManager.addAction.mock.calls[0]?.[0];

            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.ERRORED);
            expect(validationReporter.start).toBeCalled();
            expect(validationReporter.failed).toBeCalled();
            expect(revalidateFun).toBeCalled();
            expect(instance.attributes('aria-invalid')).toBe('true');
            expect(instance.attributes('aria-errormessage')).toBe(`${shareId}_errormessage`);
        });

        it('revalidate exception', async () => {
            const revalidateFun = vitest.fn(() => Promise.reject())
                , instance = shallowMount(TextInput as any, {
                props: {
                    modelValue: 'text',
                    required: true,
                    revalidate: revalidateFun
                }
            });
            expect(instance.exists()).toBe(true);

            const action = validationManager.addAction.mock.calls[0]?.[0];

            await expect(action?.checkValidity()).resolves.toBe(ValidationResult.ERRORED);
            expect(validationReporter.start).toBeCalled();
            expect(validationReporter.failed).toBeCalledWith(Violation.REVALIDATE_INVALID);
            expect(revalidateFun).toBeCalled();
            expect(instance.attributes('aria-invalid')).toBe('true');
            expect(instance.attributes('aria-errormessage')).toBe(`${shareId}_errormessage`);
        });
    });

    it('focus on oneself', async () => {
        const focus = vitest.fn()
            , instance = shallowMount(TextInput as any, { attrs: { focus } });
        expect(instance.exists()).toBe(true);

        const action = validationManager.addAction.mock.calls[0]?.[0];
        await action?.focus();

        expect(focus).toBeCalled();
    });
});
