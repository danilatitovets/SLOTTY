import { Helmet } from 'react-helmet-async';

type Props = {
  data: Record<string, unknown> | ReadonlyArray<Record<string, unknown>>;
};

/** Injects JSON-LD into document head only (not visible on page). */
export function JsonLd({ data }: Props) {
  const graphs = Array.isArray(data) ? data : [data];
  return (
    <Helmet>
      {graphs.map((entry, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(entry)}
        </script>
      ))}
    </Helmet>
  );
}
