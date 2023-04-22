---
layout: doc
title: Textarea
---

<script setup>
import { Form, Textarea } from '../../src/index';
</script>

# Textarea

Textarea 是一个用于文本输入的表单组件

::: tip
Textarea 文本输入框支持可选的 `v-model` 指令, 并支持 `trim` 和 `lazy` 修饰符
:::

## 示例

### 基本用法

<Form style="margin-top: 16px;">
  <Textarea placeholder="Please input"/>
</Form>

```vue
<Textarea placeholder="Please input"/>
```

## Props

| 属性名        | 类型                                     | 默认值    | 描述                     |
|------------|----------------------------------------|--------|------------------------|
| novalidate | boolean                                | false  | 是否禁止组件验证输入文本           |
| required   | boolean                                | false  | 用户在表单提交之前是否需要指定一个非空值   |

<style lang="scss">
@use '../../src/stylesheet/index.scss';
</style>
