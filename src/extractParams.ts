import invariant from 'invariant';
import { isInjectProps, isOptions } from './typeChecking';
import { InjectProps, StoreOptions } from './types';

const defaultOptions = {
  waitForMoreProps: false
};

export default function extractParams<Props>(
  maybeInjectProps: InjectProps<Partial<Props>> | null = null,
  maybeOptions: StoreOptions | null
): [InjectProps<Partial<Props>>, StoreOptions] {
  invariant(
    maybeInjectProps === null ||
      isInjectProps<Partial<Props>>(maybeInjectProps),
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
