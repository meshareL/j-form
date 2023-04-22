---
layout: doc
title: 安装
---

# 安装

## 使用包管理器
```shell
# npm
npm install @tomoeed/j-form

# yarn
yarn add @tomoeed/j-form

# pnpm
pnpm install @tomoeed/j-form
```

## 浏览器直接引入
直接通过浏览器的 HTML 标签引入, 使用 `JForm` 全局变量

在这里以 [jsDelivr](https://jsdelivr.com/) 举例

```html
<head>
  <!-- 引入组件样式, 或者也可以自己编写组件样式 -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tomoeed/j-form/dist/index.min.css">
  <script src="https://cdn.jsdelivr.net/npm/@tomoeed/j-form/dist/index.umd.min.js"></script>
</head>
```

::: tip
使用 CDN 引入时, 建议锁定版本, 以免将来该库升级时受到非兼容性更新的影响

锁定版本的方法请查看 [jsDelivr 文档](https://www.jsdelivr.com/documentation#id-usage-documentation)
:::
