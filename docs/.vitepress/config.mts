import { defineConfig } from 'vitepress'

// 导入主题的配置
import { blogTheme } from './blog-theme'

// 如果使用 GitHub/Gitee Pages 等公共平台部署
// 通常需要修改 base 路径，通常为“/仓库名/”
// 如果项目名已经为 name.github.io 域名，则不需要修改！
// const base = process.env.GITHUB_ACTIONS === 'true'
//   ? '/vitepress-blog-sugar-template/'
//   : '/'

// Vitepress 默认配置
// 详见文档：https://vitepress.dev/reference/site-config
export default defineConfig({
  // 继承博客主题(@sugarat/theme)
  extends: blogTheme,
  base: '/xlbth_blog/',
  lang: 'zh-cn',
  title: "Xlbth Blog",
  description: "A Personal Knowledge Base",
  lastUpdated: true,
  // 详见：https://vitepress.dev/zh/reference/site-config#head
  head: [
    // 配置网站的图标（显示在浏览器的 tab 上）
    // ['link', { rel: 'icon', href: `${base}favicon.ico` }], // 修改了 base 这里也需要同步修改
    ['link', { rel: 'icon', href: '/xlbth_blog/logo.png' }]
  ],
  themeConfig: {
    // 展示 2,6 级标题在目录中
    outline: {
      level: [2, 6],
      label: '目录'
    },
    // 默认文案修改
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '相关文章',
    lastUpdatedText: '上次更新于',

    // 设置logo
    logo: '/logo.png',
    // editLink: {
    //   pattern:
    //     'https://github.com/ATQQ/sugar-blog/tree/master/packages/blogpress/:path',
    //   text: '去 GitHub 上编辑内容'
    // },
    // TODO: 增加提效工具板块，常用的软件/AI工具，网站，插件等等。
    nav: [
      { text: '关于我', link: '/AboutMe.md' },
      {
        text: 'Android面经',
        items: [
          { text: '基础问题', link: '/interview-notes/basenotes.md' },
          { text: '安卓问题', link: '/interview-notes/Android-notes.md' },
          { text: '算法题', link: '/' },
        ]
      },
      {
        text: '项目汇总',
        items: [
          { text: 'TS码流解析工具', link: '/project-summary/TS码流解析工具.md' },
        ]
      },
      {
        text: '学习笔记',
        items: [
          { text: 'Kotlin基础语法', link: '/study-notes/kotlin/kotlin笔记.md' },
          { text: 'Kotlin协程', link: '/study-notes/kotlin/kotlin协程.md' },
          { text: 'shell脚本', link: '/study-notes/other/shell脚本.md' },
          { text: '软考知识点', link: '/study-notes/other/软考知识点.md' }
        ]
      },
      {
        text: '安卓开发经验',
        items: [
          { text: 'ADB命令', link: '/study-notes/android/guide/adb-command.md' },
          { text: 'Git使用导览', link: '/study-notes/android/guide/git-use-note.md' },
          { text: 'Git命令清单', link: '/study-notes/android/guide/git-note.md' },
          { text: '编程规范', link: '/study-notes/android/guide/style-guide.md' },
          { text: 'AmlogicS905x方案合集', link: '/study-notes/android/experience/Amlogics905x方案合集.md' },
        ]
      },
      {
        text: '源码阅读系列',
        items: [
          { text: '(一)Android系统启动流程', link: '/study-notes/android/theory/Android系统启动流程.md' },
          { text: '(二)Android的源码与编译', link: '/study-notes/android/theory/源码与编译.md' },
          { text: '(三)编译系统', link: '/study-notes/android/theory/编译系统.md' },
          // { text: '(四)进程间通信(一)', link: '/study-notes/android/theory/进程间通信(一).md' },
          // { text: '(五)进程间通信(二)', link: '/study-notes/android/theory/进程间通信(二).md' },
          // { text: '(六)Android的进程和线程', link: '/study-notes/android/theory/Android进程和线程.md' },
          // { text: '(专)线程通信机制——Handler', link: '/study-notes/android/theory/线程通信机制Handler.md' },
          // { text: '(专)线程通信机制——AsyncTask(过时)', link: '/study-notes/android/theory/线程通信机制AsyncTask.md' },
          // { text: '(专)Android权限机制', link: '/study-notes/android/theory/Android权限机制.md' },
          // { text: '(专)OTA升级机制', link: '/study-notes/android/theory/OTA升级机制.md' },
        ]
      },
      {
        text: 'BUG修改系列',
        items: [
          //Android相关
          {
            items:[
              {text: '运行项目常见BUG', link: '/bug-notes/android/运行项目常见BUG.md'}
            ]
          },
        ]
      },
      {
        text: '阅读笔记',
        items: [
          // 生活与成长
          // {
          //   items: [
          //   ]
          // },

          // 思维与认知
          {
            items: [
              { text: '被讨厌的勇气', link: '/reading-notes/被讨厌的勇气' },
            ]
          },

          // 经济与商业思维
          // {
          //   items: [
          //     ]
          // },

          // 阅读与学习方法
          // {
          //   items: [
          //   ]
          // },

          // 其他书籍
          // {
          //   items: [
          //   ]
          // },
        ],
      },
    ],
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/xlbth'
      }
    ],

  }
})
