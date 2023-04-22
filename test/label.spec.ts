import { describe, it, afterEach, expect } from 'vitest';
import { shallowMount, enableAutoUnmount } from '@vue/test-utils';
import { fetchShareIdKey, ShareIdProvider } from '../src/key';
import Label from '../src/component/label';

enableAutoUnmount(afterEach);

describe('Label component', () => {
    it('create component', () => {
        const instance = shallowMount(Label, {
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
        expect(instance.attributes('for')).toBe('0');
    });

    it('default slot', () => {
        const instance = shallowMount(Label, {
            slots: { default: () => 'text' }
        });

        expect(instance.exists()).toBe(true);
        expect(instance.text()).toBe('text');
    });

    it
        .each([ ShareIdProvider.MASTHEAD, ShareIdProvider.CHOICE_GROUP ])
        ('if it is a subcomponent of Masthead or Choice-Group, the id attribute is not added', (provider) => {
            const instance = shallowMount(Label, {
                global: { provide: { [fetchShareIdKey as symbol]: { fetch: () => '0', provider } } }
            });

            expect(instance.exists()).toBe(true);
            expect(instance.attributes('id')).toBeUndefined();
        });
});
