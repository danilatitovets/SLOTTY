import { JsonLd } from './JsonLd';
import { HUB_STRUCTURED_DATA } from './hubStructuredData';

/** Structured data for landing `/book` only. */
export function HomeStructuredData() {
  return <JsonLd data={HUB_STRUCTURED_DATA} />;
}
