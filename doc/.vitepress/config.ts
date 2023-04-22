import { defineConfig } from 'vitepress';

export default defineConfig({
    base: '/j-form/',
    lang: 'zh-CN',
    title: 'j-form',
    description: '基于浏览器约束验证的表单验证组件',
    themeConfig: {
        nav: [
            { text: '指南', link: '/guide/' },
            { text: '组件', link: '/component/form' }
        ],
        socialLinks: [
            { icon: 'github', link: 'https://github.com/meshareL/j-form' }
        ],
        sidebar: [
            {
                text: '指南',
                items: [
                    {
                        text: '简介',
                        link: '/guide/'
                    },
                    {
                        text: '快速开始',
                        link: '/guide/quick-start'
                    }
                ]
            },
            {
                text: '组件',
                items: [
                    {
                        text: 'Form',
                        link: '/component/form'
                    },
                    {
                        text: 'Caption',
                        link: '/component/caption'
                    },
                    {
                        text: 'Summary',
                        link: '/component/summary'
                    },
                    {
                        text: 'Label',
                        link: '/component/label'
                    },
                    {
                        text: 'Masthead',
                        link: '/component/masthead'
                    },
                    {
                        text: 'FormGroup',
                        link: '/component/form-group'
                    },
                    {
                        text: 'TextInput',
                        link: '/component/text-input'
                    },
                    {
                        text: 'Password',
                        link: '/component/password'
                    },
                    {
                        text: 'Textarea',
                        link: '/component/textarea'
                    }
                ]
            }
        ]
    }
});
