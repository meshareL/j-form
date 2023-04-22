---
layout: doc
title: TextInput
---

<script setup>
import { Form, TextInput } from '../../src/index';
</script>

# TextInput

TextInput 是一个用于文本输入的表单组件

::: tip
TextInput 文本输入框支持可选的 `v-model` 指令, 并支持 `trim` 和 `lazy` 修饰符
:::

## 示例

### 基本用法

<Form style="margin-top: 16px;">
  <TextInput placeholder="Please input"/>
</Form>

```vue
<TextInput placeholder="Please input"/>
```

### 大小

通过 `size` 属性改变输入框的大小, 支持 `small`, `medium` 和 `large` 三个选项

<Form>
  <TextInput size="small" placeholder="small" style="display: block; margin-bottom: 8px;"/>
  <TextInput placeholder="medium" style="display: block; margin-bottom: 8px;"/>
  <TextInput size="large" placeholder="large" style="display: block;"/>
</Form>

```vue
<TextInput size="small" placeholder="small"/>
<TextInput size="medium" placeholder="medium"/>
<TextInput size="large" placeholder="large"/>
```

## Props

| 属性名        | 类型                                     | 默认值    | 描述                     |
|------------|----------------------------------------|--------|------------------------|
| novalidate | boolean                                | false  | 是否禁止组件验证输入文本           |
| size       | 'small' \| 'medium' \| 'large'         | medium | 输入框大小                  |
| required   | boolean                                | false  | 用户在表单提交之前是否需要指定一个非空值   |
| type       | 'email' \| 'search' \| 'tel' \| 'text' | text   | 输入框类型, 文本输入框只支持有限的类型   |
| revalidate | `(value: string) => Promise<boolean>`  |        | 二次验证输入框文本, 例如验证用户名是否重复 |

<style lang="scss">
@use '../../src/stylesheet/index.scss';
</style>
