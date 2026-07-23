import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Provena',
  description: 'A canonical domain model for professional identity',
  base: '/provena/',
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Quick Start', link: '/quickstart' },
      { text: 'Problem', link: '/problem' },
      { text: 'Concept', link: '/concept' },
      { text: 'Architecture', link: '/architecture' },
      { text: 'Roadmap', link: '/roadmap' },
      { text: 'GitHub', link: 'https://github.com/valentinlineiro/provena' },
    ],
    sidebar: [
      { text: 'Home', link: '/' },
      { text: 'Quick Start', link: '/quickstart' },
      { text: 'Problem', link: '/problem' },
      { text: 'Concept', link: '/concept' },
      { text: 'Architecture', link: '/architecture' },
      { text: 'Roadmap', link: '/roadmap' },
    ],
    footer: {
      message: 'MIT License.',
    },
  },
})
