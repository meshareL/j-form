import { describe, it, beforeAll, afterAll, afterEach, expect, vitest } from 'vitest';
import { enableAutoUnmount, shallowMount, config } from '@vue/test-utils';
import { readonly, ref } from 'vue';
import {
    fetchShareIdKey,
    validationManagerKey,
    delegateValidationKey,
    inheritedNameKey,
    ShareIdProvider,
    ValidationResult
} from '../src/key';
import type { ElementAction } from '../src/key';
import { checkboxGroupValidationStatusKey, checkboxErrormessageId } from '../src/component/checkbox/key';
import { ComponentStatus } from '../src/support';
import Checkbox from '../src/component/checkbox/checkbox';

enableAutoUnmount(afterEach);

describe('Checkbox component', () => {
    const defaultConfigProvide = config.global.provide
        , shareId = '123'
        , validationManager = {
        addAction: vitest.fn(),
        removeAction: vitest.fn()
    };

    beforeAll(() => {
        config.global.provide = {
            [fetchShareIdKey as symbol]: { fetch: () => shareId, provider: ShareIdProvider.CHECKBOX_GROUP },
            [validationManagerKey as symbol]: validationManager
        }
    });

    afterAll(() => {
        config.global.provide = defaultConfigProvide
    });

    it('create component', () => {
        const instance = shallowMount(Checkbox as any, { props: { value: 'ok' } });
        expect(instance.exists()).toBe(true);
        expect(instance.attributes('type')).toBe('checkbox');
        expect(instance.attributes('value')).toBe('ok');
        expect(instance.attributes('id')).toBe(shareId);
        expect(validationManager.addAction).toBeCalled();
    });

    it('unmount component', () => {
        const instance = shallowMount(Checkbox as any, { props: { value: 'ok' } });
        expect(instance.exists()).toBe(true);

        instance.unmount();
        expect(validationManager.removeAction).toBeCalled();
    });

    describe('optional v-model directive', () => {
        it('use directive, boolean', async () => {
            const instance = shallowMount(Checkbox as any, {
                props: {
                    value: 'ok',
                    modelValue: true,
                    'onUpdate:modelValue': (value: boolean) => instance.setProps({ modelValue: value })
                }
            });
            expect(instance.exists()).toBe(true);

            await instance.get('input').setValue(false);
            expect(instance.props('modelValue')).toBe(false);
        });

        it('use directive, string array', async () => {
            const instance = shallowMount(Checkbox as any, {
                props: {
                    value: 'ok',
                    modelValue: [],
                    'onUpdate:modelValue': (value: string[]) => instance.setProps({ modelValue: value })
                }
            });
            expect(instance.exists()).toBe(true);

            await instance.get('input').setValue(true);
            expect(instance.props('modelValue')).toEqual(expect.arrayContaining([ 'ok' ]));
        });

        it('unused directive', async () => {
            const instance = shallowMount(Checkbox as any, { props: { value: 'ok' } });
            expect(instance.exists()).toBe(true);

            const input = instance.get('input');
            await input.setValue(true);

            expect(input.element.checked).toBe(true);
        });
    });

    describe('component prop', () => {
        it('disabled', async () => {
            const instance = shallowMount(Checkbox as any, {
                props: { value: 'ok', disabled: true }
            });
            expect(instance.exists()).toBe(true);
            expect(instance.attributes('disabled')).not.toBeUndefined();

            await instance.setProps({ disabled: false });
            expect(instance.attributes('disabled')).toBeUndefined();
        });

        it('name', async () => {
            const instance = shallowMount(Checkbox as any, {
                props: { value: 'ok', name: 'named' }
            });
            expect(instance.exists()).toBe(true);
            expect(instance.attributes('name')).toBe('named');

            await instance.setProps({ name: 'named1' });
            expect(instance.attributes('name')).toBe('named1');
        });

        it('value', async () => {
            const instance = shallowMount(Checkbox as any, { props: { value: 'ok' } });
            expect(instance.exists()).toBe(true);
            expect(instance.attributes('value')).toBe('ok');

            await instance.setProps({ value: 'ok1' });
            expect(instance.attributes('value')).toBe('ok1');
        });

        it('default checked', async () => {
            const instance = shallowMount(Checkbox as any, {
                props: { value: 'ok', defaultChecked: true }
            });
            expect(instance.exists()).toBe(true);

            const input = instance.get('input');
            expect(input.element.checked).toBe(true);

            await instance.setProps({ defaultChecked: false });
            expect(input.element.checked).toBe(true);
        });
    });

    it("the 'name' provided by the parent component is preferred", async () => {
        const instance = shallowMount(Checkbox as any, {
            props: { value: 'ok', name: '1' },
            global: { provide: { [inheritedNameKey as symbol]: readonly(ref('10')) } }
        });
        expect(instance.exists()).toBe(true);
        expect(instance.attributes('name')).toBe('10');
    });

    describe('validation', () => {
        it('validation', async () => {
            const instance = shallowMount(Checkbox as any, { props: { value: 'ok' } });
            expect(instance.exists()).toBe(true);

            const action = validationManager.addAction.mock.calls[0][0] as ElementAction;
            expect(await action.checkValidity()).toBe(ValidationResult.ERRORED);

            (instance.element as HTMLInputElement).checked = true;
            expect(await action.checkValidity()).toBe(ValidationResult.SUCCEED);
        });

        it('parent container validation passed', () => {
            const instance = shallowMount(Checkbox as any, {
                props: { value: 'ok' },
                global: {
                    provide: {
                        [checkboxGroupValidationStatusKey as symbol]: readonly(ref(ComponentStatus.VALIDATION_SUCCEED)),
                        [checkboxErrormessageId as symbol]: '0'
                    }
                }
            });

            expect(instance.exists()).toBe(true);
            expect(instance.attributes('aria-invalid')).toBe('false');
        });

        it('parent container validation failed', () => {
            const instance = shallowMount(Checkbox as any, {
                props: { value: 'ok' },
                global: {
                    provide: {
                        [checkboxGroupValidationStatusKey as symbol]: readonly(ref(ComponentStatus.VALIDATION_ERRORED)),
                        [checkboxErrormessageId as symbol]: '0'
                    }
                }
            });

            expect(instance.exists()).toBe(true);
            expect(instance.attributes('aria-invalid')).toBe('true');
            expect(instance.attributes('aria-errormessage')).toBe('0');
        });

        it('an exception occurred in the parent container validation', () => {
            const instance = shallowMount(Checkbox as any, {
                props: { value: 'ok' },
                global: {
                    provide: {
                        [checkboxGroupValidationStatusKey as symbol]: readonly(ref(ComponentStatus.VALIDATION_EXCEPTION)),
                        [checkboxErrormessageId as symbol]: '0'
                    }
                }
            });

            expect(instance.exists()).toBe(true);
            expect(instance.attributes('aria-invalid')).toBe('true');
            expect(instance.attributes('aria-errormessage')).toBe('0');
        });
    });

    it('notify the parent component for validation', async () => {
        const notify = vitest.fn()
            , instance = shallowMount(Checkbox as any, {
            props: { value: 'ok' },
            global: { provide: { [delegateValidationKey as symbol]: notify } }
        });
        expect(instance.exists()).toBe(true);

        const input = instance.get('input');
        await input.setValue(true);

        expect(notify).toBeCalled();
    });
});
