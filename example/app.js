'use strict';

const EUsername = Vue.defineComponent({
    name: 'EUsername',
    setup() {
        const username = Vue.ref('');
        return { username, Violation: self.JForm.Violation };
    },
    template: `
        <FormGroup required>
        <pre>{{ username }}</pre>
        <pre>{{ username.length }}</pre>
            <template #valid-feedback>The username can be used</template>
            <template #invalid-feedback="{ contain, containAny }">
                <template v-if="contain(Violation.VALUE_MISSING)">The username cannot be empty<br></template>
                <template v-else-if="contain(Violation.PATTERN_MISMATCH)">Please enter the correct username<br></template>
            </template>
            <Label>Username</Label>
            <TextInput v-model="username"
                       type="text"
                       pattern="\\w{3,10}"
                       placeholder="Username"/>
        </FormGroup>
    `
});

const EPassword = Vue.defineComponent({
    name: 'EPassword',
    setup() {
        const password = Vue.ref('');
        return { password, Violation: self.JForm.Violation };
    },
    template: `
        <FormGroup required>
            <template #valid-feedback>Ok</template>
            <template #invalid-feedback="{ contain, containAny }">
                <template v-if="contain(Violation.VALUE_MISSING)">The password cannot be empty<br></template>
                <template v-else-if="containAny(Violation.TOO_SHORT, Violation.TOO_LONG)">
                    The password must be between 5-100 characters
                    <br>
                </template>
            </template>
            <Masthead>
                <Label>Password</Label>
                <Summary>The password must be between 5-100 characters</Summary>
            </Masthead>
            <Password v-model="password"
                      minlength="5"
                      maxlength="100"
                      placeholder="Password"/>
        </FormGroup>
    `
});

const ERadioGroup = Vue.defineComponent({
    name: 'ERadioGroup',
    setup() {
        const list = [ 'One', 'Two', 'Three' ]
            , checked = Vue.ref('One');
        return { list, checked };
    },
    template: `
        <FormGroup required>
            <template #invalid-feedback>You have to choose an order</template>
            <Caption>Order</Caption>
            <RadioGroup name="sport">
                <template v-for="item of list" :key="item">
                    <ChoiceGroup>
                        <Radio :value="item" v-model="checked"/>
                        <Label>{{ item }}</Label>
                    </ChoiceGroup>
                </template>
            </RadioGroup>
        </FormGroup>
    `
});

const ECheckboxGroup = Vue.defineComponent({
    name: 'ECheckboxGroup',
    setup() {
        const list = [
            { key: 'football', name: 'Football' },
            { key: 'basketball', name: 'Basketball' },
            { key: 'baseball', name: 'Baseball' }
        ]
            , checked = Vue.ref([]);
        return { list, checked, Violation: self.JForm.Violation };
    },
    template: `
        <FormGroup required>
            <template #valid-feedback>OK</template>
            <template #invalid-feedback="{ contain }">
                {{ contain(Violation.RANGE_OVERFLOW) ? 'You can choose up to 2 sports' :  'You choose at least 1 sport' }}
            </template>
            <Masthead>
                <Caption>Sport</Caption>
                <Summary>Please choose 1-2 sports that you like</Summary>
            </Masthead>
            <CheckboxGroup name="sport"
                           orientation="horizontal"
                           :minimum="1"
                           :maximum="2">
                <ChoiceGroup v-for="item of list" :key="item.key">
                    <Checkbox :value="item.key" v-model="checked"/>
                    <Label>{{ item.name }}</Label>
                </ChoiceGroup>
            </CheckboxGroup>
        </FormGroup>
    `
});

const ESingleSelect = Vue.defineComponent({
    name: 'ESingleSelect',
    setup() {
        const list = [
            { value: 'a', text: 'A' },
            { value: 'b', text: 'B' },
            { value: 'c', text: 'C' },
            {
                label: 'D',
                children: [
                    { value: 'd-a', text: 'D-A' },
                    { value: 'd-b', text: 'D-B' },
                    { value: 'd-c', text: 'D-C' }
                ]
            }
        ];

        const selected = Vue.ref('');
        return { list, selected, Violation: self.JForm.Violation };
    },
    template: `
        <FormGroup required>
            <template #valid-feedback>Ok</template>
            <template #invalid-feedback>Please select one</template>
            <Label>Select</Label>
            <Select v-model="selected" :children="list" placeholder="Please select one"/>
        </FormGroup>
    `
});

const EMultipleSelect = Vue.defineComponent({
    name: 'EMultipleSelect',
    setup() {
        const list = [
            { value: 'a', text: 'A' },
            { value: 'b', text: 'B' },
            { value: 'c', text: 'C' },
            {
                label: 'D',
                disabled: true,
                children: [
                    { value: 'd-a', text: 'D-A' },
                    { value: 'd-b', text: 'D-B' },
                    { value: 'd-c', text: 'D-C' }
                ]
            },
            {
                label: 'E',
                children: [
                    { value: 'e-a', text: 'E-A' },
                    { value: 'e-b', text: 'E-B' },
                    { value: 'e-c', text: 'E-C' }
                ]
            }
        ];

        const selectedList = Vue.ref([ 'a' , 'b', 'e-a' ]);
        return { list, selectedList, Violation: self.JForm.Violation };
    },
    template: `
        <FormGroup required>
            <template #valid-feedback>Ok</template>
            <template #invalid-feedback="{ contain, containAny }">
                <template v-if="containAny(
                    Violation.VALUE_MISSING,
                    Violation.RANGE_UNDERFLOW,
                    Violation.RANGE_OVERFLOW)"
                >Please select 1-3 options<br></template>
            </template>
            <Label>Select</Label>
            <Select v-model="selectedList"
                    :children="list"
                    :multiple="{ minimum: 1, maximum: 3 }"/>
        </FormGroup>
    `
});


const Root = Vue.defineComponent({
    name: 'ERoot',
    components: {
        EUsername,
        EPassword,
        ERadioGroup,
        ECheckboxGroup,
        ESingleSelect,
        EMultipleSelect
    },
    template: `
        <Form class="col-6 mx-auto">
            <EUsername class="mb-3"/>
            <EPassword class="mb-3"/>
            <ERadioGroup class="mb-3"/>
            <ECheckboxGroup class="mb-3"/>
            <ESingleSelect class="mb-3"/>
            <EMultipleSelect class="mb-3"/>
            <button type="submit" class="btn btn-primary">Submit</button>
        </Form>
    `
});

Vue
    .createApp(Root)
    .component('Form', self.JForm.Form)
    .component('FormGroup', self.JForm.FormGroup)
    .component('RadioGroup', self.JForm.RadioGroup)
    .component('CheckboxGroup', self.JForm.CheckboxGroup)
    .component('ChoiceGroup', self.JForm.ChoiceGroup)
    .component('Label', self.JForm.Label)
    .component('Caption', self.JForm.Caption)
    .component('Summary', self.JForm.Summary)
    .component('Masthead', self.JForm.Masthead)
    .component('TextInput', self.JForm.TextInput)
    .component('Password', self.JForm.Password)
    .component('Radio', self.JForm.Radio)
    .component('Checkbox', self.JForm.Checkbox)
    .component('Select', self.JForm.Select)
    .mount('#root');
