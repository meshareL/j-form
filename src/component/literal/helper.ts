import { ref, readonly, inject } from 'vue';
import type { Ref, DeepReadonly } from 'vue';
import { Violation } from '../../support';
import { ValidationResult, validationStatusReporterKey } from '../../key';

type IMEHelperReturned = {
    isComposing: DeepReadonly<Ref<boolean>>;
    onCompositionstart: () => void;
    onCompositionend: (event: CompositionEvent) => void;
};

type CheckValidityHelperParam = {
    novalidate: Ref<boolean>;
    isComposing: Ref<boolean>;
    elementRef: Ref<HTMLInputElement | HTMLTextAreaElement | null>;
};

type CheckValidityHelperReturn = (revalidate?: () => Promise<boolean>) => Promise<ValidationResult>;

function imeHelper(): IMEHelperReturned {
    const isComposing = ref(false);

    function onCompositionstart(): void {
        isComposing.value = true;
    }

    function onCompositionend(event: CompositionEvent): void {
        if (!isComposing) return;

        isComposing.value = false;

        const input = event.target;
        if (!(input instanceof HTMLInputElement)) return;

        const e = new Event('input', { bubbles: true, cancelable: true });
        input.dispatchEvent(e);
    }

    return {
        isComposing: readonly(isComposing),
        onCompositionstart,
        onCompositionend
    };
}

const violationMap: Record<Exclude<keyof ValidityState, 'customError' | 'valid'>, Violation> = {
    badInput: Violation.BAD_INPUT,
    patternMismatch: Violation.PATTERN_MISMATCH,
    rangeOverflow: Violation.RANGE_OVERFLOW,
    rangeUnderflow: Violation.RANGE_UNDERFLOW,
    stepMismatch: Violation.STEP_MISMATCH,
    tooLong: Violation.TOO_LONG,
    tooShort: Violation.TOO_SHORT,
    typeMismatch: Violation.TYPE_MISMATCH,
    valueMissing: Violation.VALUE_MISSING
};

function extractViolation(validityState: ValidityState): Violation[] {
    return Object
        .entries(violationMap)
        .filter(([ key ]) => !!Reflect.get(validityState, key))
        .map(([ , value ]) => value);
}

function checkValidityHelper(param: CheckValidityHelperParam): CheckValidityHelperReturn {
    const validationReporter = inject(validationStatusReporterKey, null);

    async function check(revalidate?: () => Promise<boolean>): Promise<ValidationResult> {
        const { novalidate, isComposing, elementRef } = param;

        if (novalidate.value) {
            return ValidationResult.DISABLED;
        }

        if (isComposing.value) {
            return Promise.reject();
        }

        const control = elementRef.value;
        if (!(control instanceof HTMLInputElement)
            && !(control instanceof HTMLTextAreaElement)) {
            return Promise.reject();
        }

        if (!control.willValidate) {
            return ValidationResult.UNREQUIRED;
        }

        if (control.validity.customError) {
            control.setCustomValidity('');
        }

        validationReporter?.start();

        if (!control.checkValidity()) {
            validationReporter?.failed(...extractViolation(control.validity));
            return ValidationResult.ERRORED;
        }

        if (!revalidate) {
            validationReporter?.passed();
            return ValidationResult.SUCCEED;
        }

        control.setCustomValidity('Validating......');

        return revalidate()
            .then(status => status ? Promise.resolve() : Promise.reject())
            .then(() => {
                control.setCustomValidity('');
                validationReporter?.passed();
                return ValidationResult.SUCCEED;
            })
            .catch(() => {
                control.setCustomValidity('Failed......');
                validationReporter?.failed(Violation.REVALIDATE_INVALID);
                return ValidationResult.ERRORED;
            });
    }

    return check;
}

export { imeHelper, checkValidityHelper, extractViolation };
export type { IMEHelperReturned, CheckValidityHelperParam, CheckValidityHelperReturn };
