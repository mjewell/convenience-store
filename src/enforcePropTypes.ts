import { PropTypes } from './types';

// TODO: cannot spread this.props because it reads every property and fails here if they aren't in proptypes
export default function enforcePropTypes<Props>(
  propTypes: PropTypes,
  props: Props,
  name: string
): void {
  const propTypesKeys = new Set(Object.keys(propTypes));

  Object.keys(props).forEach(key => {
    if (propTypesKeys.has(key)) {
      return;
    }

    Object.defineProperty(props, key, {
      get() {
        throw new Error(`${key} not specified in propTypes for ${name}`);
      }
    });
  });
}
