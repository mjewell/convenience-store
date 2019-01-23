# Mobx Base Store

Mobx base store allows you to take the logic out of your react components while maintaining a familiar api. Your stores will have access to `props`, as well as `propTypes` and `defaultProps`. By pulling this logic out of components it becomes much easier to test and reuse, and reduces the coupling of your business logic to React. With this separation, we can use react only for what it's good at: DOM lifecycle and manipulation.

Stores can receive props in two ways. Props can be provided directly through the first argument; or the store can be associated with a react component, and it will have access to all the props of the component. These two sets of props are merged together and accessed by calling `this.props` in the store. Stores can also explicitly not be associated with components, in which case they will only receive the props provided through the first argument.

## API

#### create

```ts
static create(injectProps?: null | () => Partial<Props>, componentOrOptions?: null | React.Component<Partial<Props>> | { delayBinding: boolean })
```

Create an instance of the store.

Common examples, given a component with props `{ b: 2 }`:

| command                                                   | props            | runs init? |
| --------------------------------------------------------- | ---------------- | ---------- |
| `Store.create()`                                          | `{}`             | `true`     |
| `Store.create(() => ({ a: 1 }))`                          | `{ a: 1 }`       | `true`     |
| `Store.create(() => ({ a: 1 }), component)`               | `{ a: 1, b: 2 }` | `true`     |
| `Store.create(null, component)`                           | `{ b: 2 }`       | `true`     |
| `Store.create(() => ({ a: 1 })), { delayBinding: true })` | `{ a: 1 }`       | `false`    |
| `Store.create(null, { delayBinding: true })`              | `{}`             | `false`    |

#### props

The props for the store. Created by merging the return value of `injectProps` with the props associated with the bound component.

#### bindComponent

```ts
bindComponent(component: React.Component<Partial<Props>> | null)
```

Bind the store to a component, or bind it to nothing by passing null.

#### enforcePropTypes

```ts
static enforcePropTypes: boolean
```

Defaults to `true`. This will cause your stores to throw errors if you access props that are not defined in the `propTypes` outside of production environments. This helps ensure our propTypes are up to date. Set to false to disable this behaviour.

### Lifecycle

#### init

Called at most once per instance of a store. This is called immediately after the store is bound (either by calling `bindComponent`, or by calling create without passing `{ delayBinding: true }` as the second argument. Typically all initialization code should go here rather than a constructor, as you will not be able to access `props` until the store has been bound.

## Example

https://codesandbox.io/s/1qj5wxpyvq

```jsx
import React, { Component } from 'react';
import MobxBaseStore from 'mobx-base-store';
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

    this.store = FormStore.create(null, this);
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

## Design Decisions

_Why does `injectProps` have to be a function?_

By using a function, we can make sure the props are always up to date. In many cases the props may not change, so using a plain object would be fine, but it can easily become a source of bugs if those props change in the future. Enforcing that it is a function may be slightly less convenient for these cases (`{}` becomes `() => ({})`), but it is much less error-prone.

_Why do I have to use `Store.create` instead of `new Store`?_

After the store is created, we need to ensure that it has been created successfully, and potentially run `init`. Using `new` does not allow us to do this.

_Why can't I access props in the constructor?_

Props are only accessible after the store has been bound. By enforcing this, we guarantee that the store does not care where its props come from, making it more reusable. If you choose to delay binding and the store relies on some props that would come from the component then using props in the constructor would cause an error.

_Why doesn't enforcePropTypes work for nested prop types?_

The `prop-types` package does not allow you to inspect nested prop type definitions, so we can't enforce these (for now).
