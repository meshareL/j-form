import { nextTick } from 'vue';
import type { Ref } from 'vue';

function tryFocusElement<T extends HTMLElement = HTMLElement>(elementRef: Ref<T | null>): Promise<void> {
    return nextTick(() => {
        const element = elementRef.value;
        if (!(element instanceof HTMLElement)) {
            return Promise.reject();
        }

        element.focus();
    });
}

export { tryFocusElement };
