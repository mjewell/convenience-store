import invariant from 'invariant';
import { isInjectProps, isOptions } from './typeChecking';
import { InjectProps, StoreOptions } from './types';

const defaultOptions = {
  waitForMoreProps: false
};

export default function extractParams(
  maybeInjectProps: InjectProps | null = null,
  maybeOptions: StoreOptions | null
): [InjectProps, StoreOptions] {
  invariant(
    maybeInjectProps === null || isInjectProps(maybeInjectProps),
    'injectProps must be null or a function'
  );

  invariant(
    maybeOptions === null || isOptions(maybeOptions),
    'maybeOptions must be null or an options object'
  );

  const injectProps = maybeInjectProps || (() => ({}));
  const options = { ...defaultOptions, ...maybeOptions };

  return [injectProps, options];
}
