import { LoaderCircle } from 'lucide-react';

export function Spinner({ size = 16 }: { size?: number }) {
  return <LoaderCircle className="ui-spinner animate-spin" size={size} aria-hidden="true" />;
}
