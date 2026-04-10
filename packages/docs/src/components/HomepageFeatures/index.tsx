import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Static or full server',
    description: (
      <>
        Start with a static site and graduate to a full Express-backed server
        without switching frameworks. Flip <code>type: 'static'</code> to{' '}
        <code>type: 'server'</code> and your templates, styles, and assets carry
        over. Add API endpoints, middleware, and SSR when you need them — not
        before.
      </>
    ),
  },
  {
    title: 'Zero config, then grow',
    description: (
      <>
        Drop your views, scripts, and styles into conventional directories and
        Clovie auto-detects everything. No webpack config, no plugin maze. When
        you need control, <code>clovie.config.js</code> is a single flat
        object — readable in one screen.
      </>
    ),
  },
  {
    title: 'Template agnostic',
    description: (
      <>
        Bring your own engine — Handlebars, Nunjucks, Pug, Mustache, or a plain
        function. Pass a string name or a{' '}
        <code>(template, data) =&gt; html</code> callback. No lock-in.
      </>
    ),
  },
];

type AdvantageItem = {
  label: string;
  detail: string;
};

const AdvantageList: AdvantageItem[] = [
  {
    label: 'Fast builds',
    detail:
      'esbuild-powered JS bundling and SCSS compilation with incremental caching',
  },
  {
    label: 'Live reload',
    detail:
      'WebSocket-based hot reload in development, no browser extension needed',
  },
  {
    label: 'Data-driven pages',
    detail:
      'Generate pages from arrays or async API calls at build time',
  },
  {
    label: 'Composable server layers',
    detail:
      'Split APIs across modules with defineRoutes / defineApi factories',
  },
  {
    label: 'AI-ready',
    detail:
      'Ships a .cursor/skills/clovie.mdc file so AI assistants understand your project out of the box',
  },
];

function Feature({title, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <>
      <section className={styles.features}>
        <div className="container">
          <div className="row">
            {FeatureList.map((props, idx) => (
              <Feature key={idx} {...props} />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.advantages}>
        <div className="container">
          <Heading as="h2" className="text--center margin-bottom--lg">
            Why Clovie?
          </Heading>
          <ul className={styles.advantageList}>
            {AdvantageList.map(({label, detail}) => (
              <li key={label}>
                <strong>{label}</strong> — {detail}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.getStarted}>
        <div className="container">
          <Heading as="h2" className="text--center margin-bottom--lg">
            Get started
          </Heading>
          <div className={styles.codeColumns}>
            <div className={styles.codeBlock}>
              <Heading as="h4">Static site</Heading>
              <pre>
                <code>
                  {`npx clovie create my-site\ncd my-site && npm install && npm run dev`}
                </code>
              </pre>
            </div>
            <div className={styles.codeBlock}>
              <Heading as="h4">Full-stack app</Heading>
              <pre>
                <code>
                  {`npx clovie create my-app --template server\ncd my-app && npm install && npm run dev`}
                </code>
              </pre>
            </div>
          </div>
          <div className="text--center margin-top--lg">
            <Link
              className="button button--primary button--lg"
              to="/docs/">
              Read the docs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
