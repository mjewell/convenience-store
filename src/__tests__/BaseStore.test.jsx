import React from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import { autorun } from 'mobx';
import { shallow } from 'enzyme';
import BaseStore from '../BaseStore';

class MyStore extends BaseStore {
  static enforcePropTypes = false;

  callback = jest.fn();

  afterSetup() {
    this.callback();
  }
}

it('should error if it receives props that are not an object or function', () => {
  expect(() => BaseStore.create(1)).toThrow(
    'injectProps must be an object or a function'
  );

  expect(() => BaseStore.create([])).toThrow(
    'injectProps must be an object or a function'
  );

  expect(() => BaseStore.create({})).not.toThrow();
  expect(() => BaseStore.create(() => {})).not.toThrow();
});

it('should error if you use props in the constructor', () => {
  class ConstructorPropsAccess extends BaseStore {
    constructor(...args) {
      super(...args);

      this.x = this.props.x;
    }
  }

  expect(() => ConstructorPropsAccess.create({ x: 1 })).toThrowError(
    'Setup must be complete before you can access props. Either you are using new instead of create, or you are accessing props in the constructor instead of afterSetup'
  );
});

it('should error if you use new instead of create and access props', () => {
  const store = new MyStore();
  expect(() => store.props).toThrowError(
    'Setup must be complete before you can access props. Either you are using new instead of create, or you are accessing props in the constructor instead of afterSetup'
  );
});

it('should error if you access props before setup is complete', () => {
  const store = MyStore.create({});

  expect(() => store.props).toThrowError(
    'Setup must be complete before you can access props. Either pass a second argument to create, or call bindComponent'
  );
});

describe('create', () => {
  it('should not run afterSetup if it only receives a single argument', () => {
    const store = MyStore.create({});

    expect(store.callback).not.toHaveBeenCalled();
  });

  it('should run afterSetup immediately if the second argument is null', () => {
    const store = MyStore.create({}, null);

    expect(store.callback).toHaveBeenCalled();
  });

  it('should run afterSetup immediately if the second argument is a component', () => {
    const store = MyStore.create({}, null);

    expect(store.callback).toHaveBeenCalled();
  });
});

describe('bindComponent', () => {
  it('should set the component', () => {
    const store = MyStore.create({});

    store.bindComponent(null);

    expect(store.component).toBe(null);

    store.bindComponent({ props: {} });

    expect(store.component).toEqual({ props: {} });
  });

  it('should call afterSetup when you call it with null', () => {
    const store = MyStore.create({});

    expect(store.callback).not.toHaveBeenCalled();

    store.bindComponent(null);

    expect(store.callback).toHaveBeenCalled();
  });

  it('should call afterSetup when you call it with a component', () => {
    const store = MyStore.create({});

    expect(store.callback).not.toHaveBeenCalled();

    store.bindComponent({
      props: {}
    });

    expect(store.callback).toHaveBeenCalled();
  });
});

describe('props', () => {
  it('should be the props that are passed as the first argument', () => {
    const store = MyStore.create(
      {
        a: 1,
        b: 2
      },
      null
    );

    expect(store.props).toEqual({
      a: 1,
      b: 2
    });
  });

  it('should be the result of the function that is passed as the first argument', () => {
    const store = MyStore.create(
      () => ({
        a: 1,
        b: 2
      }),
      null
    );

    expect(store.props).toEqual({
      a: 1,
      b: 2
    });
  });

  it('should be taken from the component', () => {
    const store = MyStore.create(
      {},
      {
        props: {
          a: 1,
          b: 2
        }
      }
    );

    expect(store.props).toEqual({
      a: 1,
      b: 2
    });
  });

  it('should overwrite passed in props with those from the component', () => {
    const store = MyStore.create(
      {
        a: 1,
        b: 2
      },
      {
        props: {
          b: 3,
          c: 4
        }
      }
    );

    expect(store.props).toEqual({
      a: 1,
      b: 3,
      c: 4
    });
  });
});

describe('propTypes', () => {
  it('throws if you access props that arent in the propTypes', () => {
    class PropTypesClass extends BaseStore {
      static propTypes = {
        a: PropTypes.number
      };

      doSomething() {
        const x = this.props.b;
      }
    }

    const store = PropTypesClass.create({ a: 1, b: 2 }, null);

    expect(() => store.doSomething()).toThrowError(
      'b not specified in propTypes for PropTypesClass'
    );
  });

  it('doesnt throw if you access props that arent in the propTypes when enforcePropTypes is false', () => {
    class PropTypesClass extends BaseStore {
      static enforcePropTypes = false;

      static propTypes = {
        a: PropTypes.number
      };

      doSomething() {
        const x = this.props.b;
      }
    }

    const store = PropTypesClass.create({ a: 1, b: 2 }, null);

    expect(() => store.doSomething()).not.toThrow();
  });
});

it('should react to observer components', done => {
  @observer
  class ObserverComponent extends React.Component {
    constructor(props) {
      super(props);

      this.store = props.store;
      this.store.bindComponent(this);
    }

    render() {
      return <div>hello</div>;
    }
  }

  let count = 0;

  class Store extends BaseStore {
    afterSetup() {
      autorun(() => {
        this.props; // eslint-disable-line no-unused-expressions
        count += 1;
      });
    }
  }

  const store = Store.create({});
  const component = shallow(<ObserverComponent store={store} x={1} />);

  expect(count).toBe(1);

  component.setProps({ x: 2 });

  setTimeout(() => {
    expect(count).toBe(2);
    done();
  });
});
