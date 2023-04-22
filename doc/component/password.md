---
layout: doc
title: Password
---

<script setup>
import { Form, Password } from '../../src/index';
</script>

# Password

Password 是一个可切换显示隐藏的密码框

::: tip
Password 密码输入框支持可选的 `v-model` 指令
:::

## 示例

### 基本用法

<Form style="margin-top: 16px;">
  <Password placeholder="Please input"/>
</Form>

```vue
<Password placeholder="Please input"/>
```

### 大小

通过 `size` 属性改变输入框的大小, 支持 `small`, `medium` 和 `large` 三个选项

<Form>
  <Password size="small" placeholder="small" style="display: block; margin-bottom: 8px;"/>
  <Password placeholder="medium" style="display: block; margin-bottom: 8px;"/>
  <Password size="large" placeholder="large" style="display: block;"/>
</Form>

```vue
<Password size="small" placeholder="small"/>
<Password size="medium" placeholder="medium"/>
<Password size="large" placeholder="large"/>
```

## Props

| 属性名        | 类型                                    | 默认值    | 描述                   |
|------------|---------------------------------------|--------|----------------------|
| novalidate | boolean                               | false  | 是否禁止组件验证输入文本         |
| size       | 'small' \| 'medium' \| 'large'        | medium | 输入框大小                |
| required   | boolean                               | false  | 用户在表单提交之前是否需要指定一个非空值 |
| revalidate | `(value: string) => Promise<boolean>` |        | 二次验证输入框文本            |

<style lang="scss">
@use '../../src/stylesheet/index.scss';
</style>
