import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Provena — A canonical domain model for professional identity',
  description: 'A canonical domain model for professional identity',
  base: '/provena/',
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Problem', link: '/problem' },
      { text: 'Concept', link: '/concept' },
      { text: 'Examples', link: '/examples' },
      { text: 'Architecture', link: '/architecture' },
      { text: 'GitHub', link: 'https://github.com/valentinlineiro/provena' },
    ],
    sidebar: [
      { text: 'Home', link: '/' },
      { text: 'Problem', link: '/problem' },
      { text: 'Concept', link: '/concept' },
      { text: 'Examples', link: '/examples' },
      { text: 'Architecture', link: '/architecture' },
    ],
    footer: {
      message: 'MIT License.',
    },
  },
})
