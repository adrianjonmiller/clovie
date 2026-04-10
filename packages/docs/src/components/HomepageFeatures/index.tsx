import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Static or full server',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Generate static sites or run a Node HTTP server with APIs, SSR, and optional
        Express middleware — one config, two modes.
      </>
    ),
  },
  {
    title: 'Factories for APIs & routes',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Compose <code>api</code>, <code>routes</code>, <code>middleware</code>, and{' '}
        <code>hooks</code> with <code>defineRoutes</code> / <code>defineApi</code> when you
        need <code>useContext</code> or modular endpoints.
      </>
    ),
  },
  {
    title: 'Sensible defaults',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Auto-detect views, scripts, styles, and assets; esbuild and SCSS pipeline;
        live reload in dev. Start from zero config and grow into a full app.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
