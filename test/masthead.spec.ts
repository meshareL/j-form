import { describe, it, afterEach, expect } from 'vitest';
import { enableAutoUnmount, shallowMount, mount } from '@vue/test-utils';
import Masthead from '../src/component/masthead';
import { fetchShareIdKey, ShareIdProvider } from '../src/key';
import { inject, h as createElement } from 'vue';
import type { FunctionalComponent } from 'vue';

enableAutoUnmount(afterEach);

describe('Masthead component', () => {
    it('create component', () => {
        const instance = shallowMount(Masthead as any, {
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
        expect(instance.classes()).toContain('masthead');
    });

    it('default slot', () => {
        const instance = shallowMount(Masthead as any, {
            slots: { default: () => 'text' }
        });

        expect(instance.exists()).toBe(true);
        expect(instance.text()).toBe('text');
    });

    it('the masthead component should provide fetchShareIdKey dependencies for child component', () => {
        const child: FunctionalComponent = () => {
            const fetchShareId = inject(fetchShareIdKey, null);
            expect(fetchShareId).not.toBeUndefined();
            expect(fetchShareId?.fetch()).toBe('0');
            expect(fetchShareId?.provider).toBe(ShareIdProvider.MASTHEAD);
            return 'Child';
        };

        const instance = mount(Masthead as any, {
            slots: { default: () => createElement(child) },
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
    });
});
