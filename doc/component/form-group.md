---
layout: doc
title: FormGroup
---

<script setup>
import { Form, FormGroup, Label, TextInput, Violation } from '../../src/index';
import Button from 'vitepress/dist/client/theme-default/components/VPButton.vue';

function onSubmit() {
    console.log('Do something.');
}

function revalidate(value) {
    if (value === 'existed') {
        return Promise.resolve(false);
    }

    return Promise.resolve(true);
}
</script>

# FormGroup

使用 FormGroup 组件添加表单项

## 示例

### 基本用法

<Form style="margin-top: 16px;" @submit="onSubmit">
  <FormGroup required>
    <Label>用户名</Label>
    <TextInput name="username" placeholder="Please enter username"/>
  </FormGroup>
  <Button type="submit" text="提交" style="margin-top: 8px;"/>
</Form>

```vue
<template>
<Form @submit="onSubmit">
  <FormGroup required>
    <Label>用户名</Label>
    <TextInput name="username"/>
  </FormGroup>
  <button type="submit">提交</button>
</Form>
</template>

<script setup>
import { Form, FormGroup, Label, TextInput, Violation } from '@tomoeed/j-form';

function onSubmit(value) {
    console.log('Do something.');
}
</script>
```

### 自定义验证反馈信息

可以使用 `valid-feedback`, `invalid-feedback` 和 `expect-feedback` 插槽渲染验证返回信息

<Form>
  <FormGroup required>
    <template #valid-feedback>用户名可以使用</template>
    <template #invalid-feedback="{ contain, containAny }">
      <span v-if="contain(Violation.VALUE_MISSING)">用户名不能为空</span>
      <span v-else-if="containAny(Violation.TOO_LONG, Violation.TOO_SHORT)">用户名长度应在 2-10 个字符之间</span>
      <span v-else-if="contain(Violation.REVALIDATE_INVALID)">用户名已注册</span>
      <span v-else>Unknown</span>
    </template>
    <template #expect-feedback>发生未知错误, 请重新尝试</template>
    <Label>用户名</Label>
    <TextInput name="username" placeholder="Please enter username" minlength="2" maxlength="10" :revalidate="revalidate"/>
  </FormGroup>
<button type="submit">提交</button>
</Form>

```vue
<template>
<Form>
  <FormGroup required>
    <template #valid-feedback>用户名可以使用</template>
    <template #invalid-feedback="{ contain, containAny }">
      <span v-if="contain(Violation.VALUE_MISSING)">用户名不能为空</span>
      <span v-else-if="containAny(Violation.TOO_LONG, Violation.TOO_SHORT)">用户名长度应在 2-10 个字符之间</span>
      <span v-else-if="contain(Violation.REVALIDATE_INVALID)">用户名已注册</span>
      <span v-else>Unknown</span>
    </template>
    <template #expect-feedback>发生未知错误, 请重新尝试</template>
      
    <Label>用户名</Label>
    <TextInput name="username" placeholder="Please enter username" minlength="2" maxlength="10" :revalidate="revalidate"/>
  </FormGroup>
</Form>
</template>

<script setup>
import { From, FormGroup, Label, TextInput, Violation } from '@tomoeed/j-form';

function revalidate(value) {
    switch (value) {
        case 'existed':
            return Promise.resolve(false);
        default:
            return Promise.resolve(true);
    }
}
</script>
```

## Props

| 属性名        | 类型      | 默认值   | 描述                                                                                            |
|------------|---------|-------|-----------------------------------------------------------------------------------------------|
| novalidate | boolean | false | 是否禁止组件验证输入文本                                                                                  |
| required   | boolean | false | 用户在表单提交之前是否需要指定一个非空值<br> 该属性对于不同的表单控件具有不同的意义, 如 TextInput 需要输入具有有效字符的文本, 而 Radio 则需要必须选中其中的一项 |

## Slots

| 插槽名              | Props                                                                                                  | 描述         |
|------------------|--------------------------------------------------------------------------------------------------------|------------|
| default          |                                                                                                        | 使用的表单控件    |
| valid-feedback   |                                                                                                        | 表单控件验证通过   |
| invalid-feedback | `{ contain: (violation: Violation) => boolean; containAny: (...violations: Violation[]) => boolean; }` | 表单控件验证未通过  |
| expect-feedback  |                                                                                                        | 表单控件验证发生异常 |

<style lang="scss">
@use '../../src/stylesheet/index.scss';
</style>
