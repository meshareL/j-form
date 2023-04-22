---
layout: doc
title: Form
---

<script setup>
import { Form, FormGroup, Label, TextInput } from '../../src/index';
import Button from 'vitepress/dist/client/theme-default/components/VPButton.vue';

function onSubmit() {
    alert('Submitted');
}
</script>

# Form

Form 元素用于包含用于提交信息的交互式控件

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
import { Form, FormGroup, Label, TextInput } from '@tomoeed/j-form';

function onSubmit() {
    console.log('Do something.');
}
</script>
```

## Props

| 属性名        | 类型      | 默认值   | 描述                                                                                                                                        |
|------------|---------|-------|-------------------------------------------------------------------------------------------------------------------------------------------|
| novalidate | boolean | false | 是否进行表单验证, 该属性不是 form 表单的原生 [novalidate](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attributes_for_form_submission) 属性 |

## Events

| 事件名    | 类型                                        | 描述                                         |
|--------|-------------------------------------------|--------------------------------------------|
| submit | `(event: Event) => void \| Promise<void>` | 当用户提交表单时触发该事件<br/> **如果表单验证未通过, 则不会触发该事件** |

<style lang="scss">
@use '../../src/stylesheet/index.scss';
</style>
