import { provide, onUnmounted, inject, ref, readonly } from 'vue';
import type { DeepReadonly, Ref } from 'vue';
import { validationManagerKey } from '../key';
import { ValidationResult } from '../key';
import type { ElementAction } from '../key';
import { ComponentStatus } from '../support';

function collectControlAction(): Map<string, ElementAction> {
    const actions: Map<string, ElementAction> = new Map();

    function addAction(action: ElementAction, id?: string): void {
        id && actions.set(id, action);
    }

    function removeAction(id?: string): void {
        id && actions.delete(id);
    }

    provide(validationManagerKey, { addAction, removeAction });

    return actions;
}

function pushControlAction(action: ElementAction, id?: string): void {
    if (!id) return;

    const manager = inject(validationManagerKey, null);
    manager?.addAction(action, id);
    onUnmounted(() => manager?.removeAction(id));
}

type Inferred = {
    status: DeepReadonly<Ref<ComponentStatus>>;
    force: (status: ComponentStatus) => void;
    infer: (condition: ValidationResult) => void;
};

function inferComponentStatus(): Inferred {
    const inferred = ref<ComponentStatus>(ComponentStatus.INITIALIZED);

    function force(status: ComponentStatus): void {
        inferred.value = status;
    }

    function infer(condition: ValidationResult): void {
        switch (condition) {
            case ValidationResult.SUCCEED: {
                inferred.value = ComponentStatus.VALIDATION_SUCCEED;
                break;
            }
            case ValidationResult.ERRORED: {
                inferred.value = ComponentStatus.VALIDATION_ERRORED;
                break;
            }
            case ValidationResult.EXCEPTION: {
                inferred.value = ComponentStatus.VALIDATION_EXCEPTION;
                break;
            }
            default: {
                inferred.value = ComponentStatus.SILENCED;
                break;
            }
        }
    }

    return { status: readonly(inferred), force, infer };
}

export {
    collectControlAction,
    pushControlAction,
    inferComponentStatus
};
