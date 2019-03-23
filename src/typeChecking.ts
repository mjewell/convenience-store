import { InjectProps, Component, StoreOptions } from './types';

export function isObject(maybeObj: any): maybeObj is object {
  if (!maybeObj) {
    return false;
  }

  return maybeObj.constructor === Object;
}

export function isInjectProps<Props>(
  injectProps: any
): injectProps is InjectProps<Props> {
  if (!injectProps) {
    return false;
  }

  return typeof injectProps === 'function';
}

export function isComponent<Props>(
  component: any
): component is Component<Props> {
  if (!component) {
    return false;
  }

  return isObject(component.props);
}

export function isOptions(options: any): options is StoreOptions {
  if (!options) {
    return false;
  }

  return typeof options.waitForMoreProps === 'boolean';
}
