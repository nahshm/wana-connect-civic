import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://amacivic.com';

interface PageMetaProps {
  title: string;
  description: string;
  path?: string;
  type?: 'website' | 'article';
  image?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Per-route SEO metadata. Sets title, description, canonical, og:*, twitter:*,
 * and optional JSON-LD structured data. Client-side only — accurate for JS-executing
 * crawlers (Googlebot) and unified head across all public routes.
 */
export const PageMeta = ({
  title,
  description,
  path = '',
  type = 'website',
  image,
  jsonLd,
}: PageMetaProps) => {
  const url = `${SITE_URL}${path}`;
  const fullTitle = title.includes('ama') ? title : `${title} | ama`;
  const jsonLdArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      {jsonLdArray.map((data, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
};

export default PageMeta;
