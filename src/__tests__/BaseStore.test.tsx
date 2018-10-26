import { shallow } from "enzyme";
import { autorun } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import BaseStore from "../BaseStore";

/* tslint:disable max-classes-per-file */

class MyStore extends BaseStore {
  public static enforcePropTypes = false;

  public callback = jest.fn();

  public init() {
    this.callback();
  }
}

it("should error if it receives props that are not null or function", () => {
  expect(() => BaseStore.create(1)).toThrow(
    "injectProps must be null or a function"
  );

  expect(() => BaseStore.create([])).toThrow(
    "injectProps must be null or a function"
  );

  expect(() => BaseStore.create({})).toThrow(
    "injectProps must be null or a function"
  );

  expect(() => BaseStore.create(null)).not.toThrow();
  expect(() => BaseStore.create(() => ({}))).not.toThrow();
});

it("should error if you access props in the constructor", () => {
  class ConstructorPropsAccess extends BaseStore {
    constructor(injectedProps: () => { x: number }) {
      super(injectedProps);

      this.props; // tslint:disable-line no-unused-expression
    }
  }

  expect(() => ConstructorPropsAccess.create(() => ({ x: 1 }))).toThrowError(
    "Binding must be complete before you can access props. Either you are using new instead of create, or you are accessing props in the constructor instead of init"
  );
});

it("should error if you use new instead of create and access props", () => {
  const store = new MyStore();
  expect(() => store.props).toThrowError(
    "Binding must be complete before you can access props. Either you are using new instead of create, or you are accessing props in the constructor instead of init"
  );
});

it("should error if you access props before setup is complete", () => {
  const store = MyStore.create(null, { delayBinding: true });

  expect(() => store.props).toThrowError(
    "Binding must be complete before you can access props. Either call bindComponent, or do not pass delayBinding"
  );
});

describe("create", () => {
  it("should run init if it receives no arguments", () => {
    const store = MyStore.create() as MyStore;

    expect(store.callback).toHaveBeenCalled();
  });

  it("should run init if it only receives a single argument", () => {
    const store = MyStore.create(() => ({})) as MyStore;

    expect(store.callback).toHaveBeenCalled();
  });

  it("should run init immediately if the second argument is null", () => {
    const store = MyStore.create(() => ({}), null) as MyStore;

    expect(store.callback).toHaveBeenCalled();
  });

  it("should run init immediately if the second argument is a component", () => {
    const store = MyStore.create(() => ({}), { props: {} }) as MyStore;

    expect(store.callback).toHaveBeenCalled();
  });

  it("should not run init immediately if the second argument has a truthy property called delayBinding", () => {
    const store = MyStore.create(() => ({}), { delayBinding: true }) as MyStore;

    expect(store.callback).not.toHaveBeenCalled();
  });
});

describe("bindComponent", () => {
  it("should set the component", () => {
    const store = MyStore.create() as MyStore;

    store.bindComponent(null);

    expect(store.component).toBe(null);

    store.bindComponent({ props: {} });

    expect(store.component).toEqual({ props: {} });
  });

  describe("when it is not bound in the constructor", () => {
    it("should call init when you call it with null", () => {
      const store = MyStore.create(null, { delayBinding: true }) as MyStore;

      expect(store.callback).not.toHaveBeenCalled();

      store.bindComponent(null);

      expect(store.callback).toHaveBeenCalled();
    });

    it("should call init when you call it with a component", () => {
      const store = MyStore.create(null, { delayBinding: true }) as MyStore;

      expect(store.callback).not.toHaveBeenCalled();

      store.bindComponent({
        props: {}
      });

      expect(store.callback).toHaveBeenCalled();
    });

    it("should only call init the first time you call it", () => {
      const store = MyStore.create(null, { delayBinding: true }) as MyStore;

      expect(store.callback).not.toHaveBeenCalled();

      store.bindComponent(null);

      expect(store.callback).toHaveBeenCalled();

      store.bindComponent({ props: {} });

      expect(store.callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("when it is bound in the constructor", () => {
    it("should not call init when you call it with null", () => {
      const store = MyStore.create() as MyStore;

      expect(store.callback).toHaveBeenCalled();

      store.bindComponent(null);

      expect(store.callback).toHaveBeenCalledTimes(1);
    });

    it("should not call init when you call it with a component", () => {
      const store = MyStore.create() as MyStore;

      expect(store.callback).toHaveBeenCalled();

      store.bindComponent({
        props: {}
      });

      expect(store.callback).toHaveBeenCalledTimes(1);
    });
  });
});

describe("props", () => {
  it("should be an empty object if no arguments are provided", () => {
    const store = MyStore.create();

    expect(store.props).toEqual({});
  });

  it("should be the result of the function that is passed as the first argument", () => {
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

  it("should be taken from the component", () => {
    const store = MyStore.create(null, {
      props: {
        a: 1,
        b: 2
      }
    });

    expect(store.props).toEqual({
      a: 1,
      b: 2
    });
  });

  it("should overwrite passed in props with those from the component", () => {
    const store = MyStore.create(
      () => ({
        a: 1,
        b: 2
      }),
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

describe("propTypes", () => {
  it("throws if you access props that arent in the propTypes", () => {
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
      "b not specified in propTypes for PropTypesClass"
    );
  });

  it("doesnt throw if you access props that arent in the propTypes when enforcePropTypes is false", () => {
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
  it("doesnt throw if you access nested props that arent in the propTypes", () => {
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

it("should react to observer components", done => {
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
      this.store.bindComponent(this);
    }

    public render() {
      return <div>hello</div>;
    }
  }

  const store = Store.create(null, { delayBinding: true }) as Store;

  const component = shallow(<ObserverComponent store={store} x={1} />);

  expect(count).toBe(1);

  component.setProps({ x: 2 });

  setTimeout(() => {
    expect(count).toBe(2);
    done();
  });
});
