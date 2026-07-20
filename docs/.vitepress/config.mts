import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "JSON Schema Studio",
  description: "Documentation for JSON Schema Studio — a visual, graph-based JSON Schema explorer",
  base: '/docs/',
  cleanUrls: false,

  lastUpdated: true,

  themeConfig: {

    logo: {
      light: '/logo-light.svg',
      dark: '/logo-dark.svg'
    },
    siteTitle: 'JSON Schema Studio',

    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Guide',
        items: [
          { text: 'What is JSON Schema Studio?', link: '/guide/what-is-json-schema-studio' },
          { text: 'Why JSON Schema Studio?', link: '/guide/why-json-schema-studio' },
          { text: 'Quick Start', link: '/guide/quick-start' },
          { text: 'Installation', link: '/guide/installation' }
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'Understanding the Visualization', link: '/guide/visualization' },
          { text: 'How It Works', link: '/guide/how-it-works' },
          { text: 'FAQ & Known Issues', link: '/guide/faq' },
          { text: 'Roadmap', link: '/guide/roadmap' }
        ]
      },
      {
        text: 'Contributing',
        items: [
          { text: 'Contributing Guide', link: '/contributing/guide' },
          { text: 'Versioning & Changesets', link: '/contributing/versioning' }
        ]
      },
      { text: 'Launch App', link: 'https://studio.ioflux.org' }
    ],

    sidebar: [
      {
        text: 'Introduction',
        collapsed: false,
        items: [
          { text: 'What is JSON Schema Studio?', link: '/guide/what-is-json-schema-studio' },
          { text: 'Why JSON Schema Studio?', link: '/guide/why-json-schema-studio' }
        ]
      },
      {
        text: 'Getting Started',
        collapsed: false,
        items: [
          { text: 'Quick Start', link: '/guide/quick-start' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Tech Stack', link: '/guide/tech-stack' }
        ]
      },
      {
        text: 'Guide',
        collapsed: true,
        items: [
          { text: 'Understanding the Visualization', link: '/guide/visualization' },
          { text: 'How It Works', link: '/guide/how-it-works' },
          { text: 'Controls', link: '/guide/controls' }
        ]
      },
      {
        text: 'Reference',
        collapsed: true,
        items: [
          { text: 'FAQ & Known Issues', link: '/guide/faq' },
          { text: 'Roadmap', link: '/guide/roadmap' }
        ]
      },
      {
        text: 'Contributing',
        collapsed: true,
        items: [
          { text: 'Contributing Guide', link: '/contributing/guide' },
          { text: 'Versioning & Changesets', link: '/contributing/versioning' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ioflux-org/studio-json-schema' }
    ],

    search: {
      provider: 'local'
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 ioflux-org'
    },

    outline: {
      level: [2, 3],
      label: 'On this page'
    },

    editLink: {
      pattern: 'https://github.com/ioflux-org/studio-json-schema/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    }
  }
})