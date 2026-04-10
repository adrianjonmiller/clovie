import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Clovie',
  tagline: 'Vintage web dev tooling with modern quality of life',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  // Production default matches GitHub Pages project sites. For local dev, `npm start` sets DOCUSAURUS_BASE_URL=/.
  url: 'https://adrianjonmiller.github.io',
  baseUrl: process.env.DOCUSAURUS_BASE_URL ?? '/',

  organizationName: 'adrianjonmiller',
  projectName: 'clovie',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: 'docs',
          path: 'docs',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/adrianjonmiller/clovie/tree/main/website/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Clovie',
      logo: {
        alt: 'Clovie',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/adrianjonmiller/clovie',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://www.npmjs.com/package/clovie',
          label: 'npm',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Overview',
              to: '/docs/',
            },
            {
              label: 'Configuration',
              to: '/docs/configuration',
            },
          ],
        },
        {
          title: 'Project',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/adrianjonmiller/clovie',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/clovie',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Clovie contributors. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
