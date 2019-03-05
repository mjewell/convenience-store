import { reaction } from 'mobx';
import invariant from 'invariant';
import MobxBaseStore from './BaseStore';
import { isComponent } from './typeChecking';
import { Component, Props } from './types';

export default function bindComponent(
  store: MobxBaseStore,
  component: Component
) {
  invariant(isComponent(component), 'component must be a React component');

  reaction(() => component.props, (props: Props) => store.setProps(props), {
    fireImmediately: true
  });
}
