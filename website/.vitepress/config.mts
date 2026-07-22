import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Provena',
  description: 'A canonical domain model for professional identity',
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Why', link: '/why' },
      { text: 'How it works', link: '/how-it-works' },
      { text: 'Example', link: '/example' },
      { text: 'Architecture', link: '/architecture' },
    ],
    sidebar: [
      { text: 'Home', link: '/' },
      { text: 'Why Provena', link: '/why' },
      { text: 'How it works', link: '/how-it-works' },
      { text: 'Example', link: '/example' },
      { text: 'Architecture', link: '/architecture' },
    ],
    footer: {
      message: 'MIT License. Built with VitePress.',
    },
    search: { provider: 'local' },
  },
})
