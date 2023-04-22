---
layout: doc
title: 简介
---

# 简介

j-form 是一个基于浏览器 [约束验证](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Constraint_validation)
并扩展了原生约束验证的表单库

## 示例

```vue
<template>
<Form @submit="onSubmit">
  <FormGroup required>
    <Label>Username</Label>
    <TextInput/>
  </FormGroup>

  <button type="button">Submit</button>
</Form>
</template>

<script setup>
import { Form, FormGroup, Label, TextInput } from '@tomoeed/j-form';

function onSubmit(event) {
    // do something
}
</script>
```
