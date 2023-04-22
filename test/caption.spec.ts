import { describe, it, afterEach, expect } from 'vitest';
import { enableAutoUnmount, shallowMount } from '@vue/test-utils';
import Caption from '../src/component/caption';
import { fetchShareIdKey, ShareIdProvider } from '../src/key';

enableAutoUnmount(afterEach);

describe('Caption component', () => {
    it('create component', () => {
        const instance = shallowMount(Caption);

        expect(instance.exists()).toBe(true);
        expect(instance.classes()).toContain('caption');
    });

    it('default slot', () => {
        const instance = shallowMount(Caption, {
            slots: { default: () => 'text' }
        });

        expect(instance.exists()).toBe(true);
        expect(instance.text()).toBe('text');
    });

    it('if the component is a child of the Masthead component, the id attribute is not added', () => {
        const instance = shallowMount(Caption, {
            global: {
                provide: {
                    [fetchShareIdKey as symbol]: {
                        fetch: () => '0',
                        provider: ShareIdProvider.MASTHEAD
                    }
                }
            }
        });

        expect(instance.exists()).toBe(true);
        expect(instance.attributes('id')).toBeUndefined();
    });

    it('if the component is not a child of the Masthead component, add the id attribute', () => {
        const instance = shallowMount(Caption, {
            global: {
                provide: {
                    [fetchShareIdKey as symbol]: {
                        fetch: () => '0',
                        provider: ShareIdProvider.FORM_GROUP
                    }
                }
            }
        });

        expect(instance.exists()).toBe(true);
        expect(instance.attributes('id')).toBe('0_masthead');
    });
});

