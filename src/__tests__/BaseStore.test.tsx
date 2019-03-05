import { configure } from 'mobx';
import PropTypes from 'prop-types';
import BaseStore from '..';

/* tslint:disable max-classes-per-file */

configure({ enforceActions: 'observed' });

class MyStore extends BaseStore {
  public static enforcePropTypes = false;

  public callback = jest.fn();

  public init() {
    this.props; // tslint:disable-line no-unused-expression
    this.callback();
  }
}

it('errors if injectProps is not null or function', () => {
  expect(() => BaseStore.create(1)).toThrow(
    'injectProps must be null or a function'
  );

  expect(() => BaseStore.create([])).toThrow(
    'injectProps must be null or a function'
  );

  expect(() => BaseStore.create({})).toThrow(
    'injectProps must be null or a function'
  );

  expect(() => BaseStore.create()).not.toThrow();
  expect(() => BaseStore.create(null)).not.toThrow();
  expect(() => BaseStore.create(() => ({}))).not.toThrow();
});

it('errors if options is not null or options', () => {
  expect(() => BaseStore.create(null, 1)).toThrow(
    'maybeOptions must be null or an options object'
  );

  expect(() => BaseStore.create(null, [])).toThrow(
    'maybeOptions must be null or an options object'
  );

  expect(() => BaseStore.create(null, {})).toThrow(
    'maybeOptions must be null or an options object'
  );

  expect(() => BaseStore.create(null, { waitForMoreProps: 123 })).toThrow(
    'maybeOptions must be null or an options object'
  );

  expect(() => BaseStore.create(null, null)).not.toThrow();
  expect(() =>
    BaseStore.create(null, { waitForMoreProps: false })
  ).not.toThrow();
  expect(() =>
    BaseStore.create(null, { waitForMoreProps: true })
  ).not.toThrow();
});

it('errors if you access props in the constructor', () => {
  class ConstructorPropsAccess extends BaseStore {
    constructor(injectedProps: () => { x: number }) {
      super(injectedProps);

      this.props; // tslint:disable-line no-unused-expression
    }
  }

  expect(() => ConstructorPropsAccess.create(() => ({ x: 1 }))).toThrowError(
    'Setup must be complete before you can access props. Either you are using new instead of create, or you are accessing props in the constructor instead of init'
  );
});

// it('errors if you use new instead of create and access props', () => {
//   const store = new MyStore();
//   expect(() => store.props).toThrowError(
//     'Setup must be complete before you can access props. Either you are using new instead of create, or you are accessing props in the constructor instead of init'
//   );
// });

it('errors if you access props before setup is complete', () => {
  const store = MyStore.create(null, { waitForMoreProps: true });

  expect(() => store.props).toThrowError(
    'Setup must be complete before you can access props.'
  );
});

describe('create', () => {
  it('runs init immediately if it receives no arguments', () => {
    const store = MyStore.create() as MyStore;

    expect(store.callback).toHaveBeenCalled();
  });

  it('runs init immediately if it only receives a single argument', () => {
    const store = MyStore.create(() => ({})) as MyStore;

    expect(store.callback).toHaveBeenCalled();
  });

  it('runs init immediately if the second argument is null', () => {
    const store = MyStore.create(() => ({}), null) as MyStore;

    expect(store.callback).toHaveBeenCalled();
  });

  it('does not run init immediately if the second argument has a true property called waitForMoreProps', () => {
    const store = MyStore.create(() => ({}), {
      waitForMoreProps: true
    }) as MyStore;

    expect(store.callback).not.toHaveBeenCalled();
  });
});

describe('init', () => {
  it('can access props', () => {
    class InitPropsStore extends BaseStore {
      public static enforcePropTypes = false;

      public callback = jest.fn();

      public init() {
        this.props; // tslint:disable-line no-unused-expression
      }
    }

    expect(() => InitPropsStore.create()).not.toThrow();
  });
});

describe('setProps', () => {
  it('triggers init if it hasnt been triggered yet', () => {
    const store = MyStore.create(null, { waitForMoreProps: true }) as MyStore;

    expect(store.callback).not.toHaveBeenCalled();

    store.setProps({});

    expect(store.callback).toHaveBeenCalled();
  });

  it('doesnt trigger init if it has been triggered', () => {
    const store = MyStore.create() as MyStore;

    expect(store.callback).toHaveBeenCalledTimes(1);

    store.setProps({});

    expect(store.callback).toHaveBeenCalledTimes(1);
  });
});

describe('props', () => {
  it('is an empty object if no arguments are provided', () => {
    const store = MyStore.create();

    expect(store.props).toEqual({});
  });

  it('errors if injectProps does not return an object', () => {
    expect(() => {
      const store = MyStore.create(() => 1);
      store.props; // tslint:disable-line no-unused-expression
    }).toThrow('injectProps must return an object');

    expect(() => {
      const store = MyStore.create(() => []);
      store.props; // tslint:disable-line no-unused-expression
    }).toThrow('injectProps must return an object');

    expect(() => {
      const store = MyStore.create(() => null);
      store.props; // tslint:disable-line no-unused-expression
    }).toThrow('injectProps must return an object');
  });

  it('is the result of the function that is passed as the first argument', () => {
    const store = MyStore.create(() => ({
      a: 1,
      b: 2
    }));

    expect(store.props).toEqual({
      a: 1,
      b: 2
    });
  });

  it('is taken from the set props', () => {
    const store = MyStore.create();

    store.setProps({
      a: 1,
      b: 2
    });

    expect(store.props).toEqual({
      a: 1,
      b: 2
    });
  });

  it('overwrites passed in props with those from the set props', () => {
    const store = MyStore.create(() => ({
      a: 1,
      b: 2
    }));

    store.setProps({
      b: 3,
      c: 4
    });

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
      public static propTypes = {
        a: PropTypes.number
      };

      public doSomething() {
        const x = this.props.b;
      }
    }

    const store = PropTypesClass.create(
      () => ({ a: 1, b: 2 }),
      null
    ) as PropTypesClass;

    expect(() => store.doSomething()).toThrowError(
      'b not specified in propTypes for PropTypesClass'
    );
  });

  it('does not throw if you access props that arent in the propTypes when enforcePropTypes is false', () => {
    class PropTypesClass extends BaseStore {
      public static enforcePropTypes = false;

      public static propTypes = {
        a: PropTypes.number
      };

      public doSomething() {
        const x = this.props.b;
      }
    }

    const store = PropTypesClass.create(
      () => ({ a: 1, b: 2 }),
      null
    ) as PropTypesClass;

    expect(() => store.doSomething()).not.toThrow();
  });

  // this is not desired but proptypes doesn't let you inspect nested proptypes
  // this just serves as documentation of the current behaviour
  it('does not throw if you access nested props that arent in the propTypes', () => {
    class PropTypesClass extends BaseStore {
      public static propTypes = {
        a: PropTypes.shape({
          b: PropTypes.number
        })
      };

      public doSomething() {
        const x = this.props.a.c;
      }
    }

    const store = PropTypesClass.create(
      () => ({ a: { b: 1, c: 2 } }),
      null
    ) as PropTypesClass;

    expect(() => store.doSomething()).not.toThrow();
  });
});
