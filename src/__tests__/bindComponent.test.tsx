import { shallow } from 'enzyme';
import { autorun, configure } from 'mobx';
import { observer } from 'mobx-react';
import React from 'react';
import BaseStore, { bindComponent } from '..';

configure({ enforceActions: 'observed' });

class MyStore extends BaseStore {
  public static enforcePropTypes = false;

  public callback = jest.fn();

  public init() {
    this.props; // tslint:disable-line no-unused-expression
    this.callback();
  }
}

it('errors when not called with a component', () => {
  const store = MyStore.create() as MyStore;
  expect(() => bindComponent(store, 1 as any)).toThrow(
    'component must be a React component'
  );
  expect(() => bindComponent(store, [] as any)).toThrow(
    'component must be a React component'
  );
});

it('sets the props to the components props', () => {
  const store = MyStore.create() as MyStore;
  bindComponent(store, {
    props: { a: 1 }
  });
  expect(store.props).toEqual({ a: 1 });
});

it('reacts to observer components', done => {
  let count = 0;

  class Store extends BaseStore {
    public init() {
      autorun(() => {
        this.props; // tslint:disable-line no-unused-expression
        count += 1;
      });
    }
  }

  @observer
  class ObserverComponent extends React.Component<{ store: Store; x: number }> {
    public store: Store;

    constructor(props: { store: Store; x: number }) {
      super(props);

      this.store = props.store;
      bindComponent(this.store, this);
    }

    public render() {
      return <div>hello</div>;
    }
  }

  const store = Store.create(null, { waitForMoreProps: true }) as Store;

  const component = shallow(<ObserverComponent store={store} x={1} />);

  expect(count).toBe(1);

  component.setProps({ x: 2 });

  setTimeout(() => {
    expect(count).toBe(2);
    done();
  });
});
