import invariant from "invariant";
import { isComponent, isInjectProps, isOptions } from "./typeChecking";
import { Component, InjectProps, StoreOptions } from "./types";

const defaultOptions = {
  delayBinding: false
};

export default function extractParams(
  maybeInjectProps: InjectProps | null = null,
  componentOrOptions: Component | StoreOptions | null
): [InjectProps, Component | null, StoreOptions] {
  invariant(
    maybeInjectProps === null || isInjectProps(maybeInjectProps),
    "injectProps must be null or a function"
  );

  invariant(
    componentOrOptions === null ||
      isComponent(componentOrOptions) ||
      isOptions(componentOrOptions),
    "componentOrOptions must be null, a component, or an options object"
  );

  const injectProps = maybeInjectProps || (() => ({}));

  if (isOptions(componentOrOptions)) {
    return [injectProps, null, componentOrOptions];
  }

  return [injectProps, componentOrOptions, defaultOptions];
}
