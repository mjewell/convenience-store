# Mobx Base Store

Mobx base store allows you to take the logic out of your react components while maintaining a familiar api. Your stores will have access to `props`, as well as `propTypes` and `defaultProps`. By pulling this logic out of components it becomes much easier to test and reuse, and reduces the coupling of your business logic to React. With this separation, we can use react only for what it's good at: DOM lifecycle and manipulation.

Stores can receive props in two ways. Props can be provided directly through the first function argument; or you can explicitly provide them through setProps. These two sets of props are merged together and accessed by calling `this.props` in the store. Stores can also be associated with components, and they will have access to all the props of the component.

## API

#### create

```ts
static create(injectProps?: null | () => Partial<Props>, options?: null | { waitForMoreProps: boolean })
```

Create an instance of the store.

Common examples:

| command                                                       | props      | runs init? |
| ------------------------------------------------------------- | ---------- | ---------- |
| `Store.create()`                                              | `{}`       | `true`     |
| `Store.create(null, { waitForMoreProps: true })`              | `{}`       | `false`    |
| `Store.create(() => ({ a: 1 }))`                              | `{ a: 1 }` | `true`     |
| `Store.create(() => ({ a: 1 })), { waitForMoreProps: true })` | `{ a: 1 }` | `false`    |

#### props

The props for the store. Created by merging the return value of `injectProps` with the props set through setProps.

#### setProps

```ts
setProps(props: Partial<Props>, options?: { waitForMoreProps: boolean })
```

Sets the props of the store explicitly. These props will be merged with, and take precedence over, the props from the `injectProps` function. If called without `waitForMoreProps: true`, this will trigger `init`, unless it has already been triggered.

#### enforcePropTypes

```ts
static enforcePropTypes: boolean
```

Defaults to `true`. This will cause your stores to throw errors if you access props that are not defined in the `propTypes` outside of production environments. This helps ensure our propTypes are up to date. Set to false to disable this behaviour.

### Lifecycle

#### init

Called at most once per instance of a store. This is called immediately after the store is created unless you pass `waitForMoreProps: true`. Otherwise, it will be called the first time you call `setProps` without `waitForMoreProps: true`. Typically all initialization code should go here rather than a constructor, as you will not be able to access `props` until the store has been bound.

## Other Utilities

#### bindComponent

```ts
bindComponent(store: MobxBaseStore<Props>, component: React.Component<Partial<Props>>)
```

Bind the store to a component, causing it to keep the props of the store in sync with those of the component. For this to work the component must be an `observer` (from `mobx-react`).

## Example

https://codesandbox.io/s/1qj5wxpyvq

```jsx
import React, { Component } from 'react';
import MobxBaseStore, { bindComponent } from 'mobx-base-store';
import { action, flow, observable } from 'mobx';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';

class FormStore extends MobxBaseStore {
  static propTypes = {
    lastLogin: PropTypes.string
  };

  @observable email = '';
  @observable password = '';
  @observable submitting = false;

  @action
  init() {
    const { lastLogin } = this.props;

    if (lastLogin) {
      this.email = lastLogin;
    }
  }

  @action.bound
  setEmail(e) {
    this.email = e.target.value;
  }

  @action.bound
  setPassword(e) {
    this.password = e.target.value;
  }

  @action.bound
  logIn = flow(
    function*(e) {
      e.preventDefault();
      this.submitting = true;
      yield new Promise(resolve => {
        setTimeout(() => {
          resolve();
        }, 1000);
      });
      this.submitting = false;
    }.bind(this)
  );
}

@observer
class Form extends Component {
  constructor(props) {
    super(props);

    this.store = FormStore.create(null);
    bindComponent(this.store, this);
  }

  render() {
    const {
      email,
      setEmail,
      password,
      setPassword,
      submitting,
      logIn
    } = this.store;

    return (
      <form>
        <div>
          <label for="email">Email</label>
          <input
            id="email"
            value={email}
            onChange={setEmail}
            disabled={submitting}
          />
        </div>
        <div>
          <label for="password">Password</label>
          <input
            id="password"
            value={password}
            onChange={setPassword}
            type="password"
            disabled={submitting}
          />
        </div>
        <button type="submit" onClick={logIn} disabled={submitting}>
          {submitting ? 'Logging In...' : 'Log In'}
        </button>
      </form>
    );
  }
}
```

For a more comprehensive example showing several different ways mobx-base-store can be used, check out this codesandbox: https://codesandbox.io/s/r43n32k6nn

## Design Decisions

_Why does `injectProps` have to be a function?_

By using a function, we can make sure the props are always up to date. In many cases the props may not change, so using a plain object would be fine, but it can easily become a source of bugs if those props change in the future. Enforcing that it is a function may be slightly less convenient for these cases (`{}` becomes `() => ({})`), but it is much less error-prone.

_Why do I have to use `Store.create` instead of `new Store`?_

After the store is created, we need to ensure that it has been created successfully, and potentially run `init`. Using `new` does not allow us to do this.

_Why can't I access props in the constructor?_

Props are only accessible after the store has been bound. By enforcing this, we guarantee that the store does not care where its props come from, making it more reusable. If you choose to delay binding and the store relies on some props that would come from the component then using props in the constructor would cause an error.

_Why doesn't enforcePropTypes work for nested prop types?_

The `prop-types` package does not allow you to inspect nested prop type definitions, so we can't enforce these (for now).
