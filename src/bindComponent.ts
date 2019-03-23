import invariant from 'invariant';
import { reaction, IReactionDisposer } from 'mobx';
import MobxBaseStore from './BaseStore';
import { isComponent } from './typeChecking';
import { Component } from './types';

export default function bindComponent<
  StoreProps,
  ComponentProps extends Partial<{ [K in keyof StoreProps]: StoreProps[K] }>
>(
  store: MobxBaseStore<StoreProps>,
  component: Component<ComponentProps>
): IReactionDisposer {
  invariant(isComponent(component), 'component must be a React component');

  return reaction(() => component.props, props => store.setProps(props), {
    fireImmediately: true
  });
}
