import type { InjectionKey, DeepReadonly, Ref } from 'vue';
import { ComponentStatus } from '../../support';

const checkboxErrormessageId = Symbol('checkbox errormessage id') as InjectionKey<string>
    , checkboxGroupValidationStatusKey =
    Symbol('checkbox group validation status') as InjectionKey<DeepReadonly<Ref<ComponentStatus>>>;

export { checkboxErrormessageId, checkboxGroupValidationStatusKey };
