import { action, computed, observable } from 'mobx';
import PropTypes from 'prop-types';
import invariant from 'invariant';

function isObject(thing) {
  return thing instanceof Object && !Array.isArray(thing);
}

export default class BaseStore {
  static enforcePropTypes = true;

  @observable
  storeMetadata = {
    constructionComplete: false,
    constructorComponentProvided: false,
    setupComplete: false
  };

  @observable
  component;

  @observable
  propsMadeObservable = false;

  @action
  static create(...args) {
    const instance = new this(...args);

    instance.storeMetadata.constructionComplete = true;

    if (instance.storeMetadata.constructorComponentProvided) {
      instance.completeSetup();
    }

    return instance;
  }

  constructor(injectProps = {}, component) {
    invariant(
      typeof injectProps === 'function' || isObject(injectProps),
      'injectProps must be an object or a function'
    );

    if (process.env.NODE_ENV !== 'test') {
      setTimeout(() => {
        invariant(
          this.storeMetadata.constructionComplete,
          `Stores should be created with ${
            this.constructor.name
          }.create instead of new ${this.constructor.name}`
        );
      });
    }

    this.injectProps = injectProps;
    this.component = component;

    this.storeMetadata.constructorComponentProvided = arguments.length > 1;

    // trigger this on the next tick because components that are marked as observer
    // do not get their props made observable until then, and we need to rerun `props`
    // based on them
    // setTimeout(() => {
    //   this.propsMadeObservable = true;
    // });
  }

  @action.bound
  completeSetup() {
    this.storeMetadata.setupComplete = true;

    if (typeof this.afterSetup === 'function') {
      this.afterSetup();
    }
  }

  @action.bound
  bindComponent(component) {
    this.component = component;
    this.completeSetup();
  }

  @computed
  get componentProps() {
    // this.propsMadeObservable; // eslint-disable-line no-unused-expressions
    return this.component ? this.component.props : {};
  }

  @computed
  get injectedProps() {
    if (typeof this.injectProps === 'function') {
      return this.injectProps();
    }

    return this.injectProps || {};
  }

  @computed
  get defaultProps() {
    return this.constructor.defaultProps || {};
  }

  @computed
  get props() {
    invariant(
      this.storeMetadata.constructionComplete,
      'Setup must be complete before you can access props. Either you are using new instead of create, or you are accessing props in the constructor instead of afterSetup'
    );

    invariant(
      this.storeMetadata.setupComplete,
      'Setup must be complete before you can access props. Either pass a second argument to create, or call bindComponent'
    );

    const newProps = {
      ...this.defaultProps,
      ...this.injectedProps,
      ...this.componentProps
    };

    if (process.env.NODE_ENV !== 'production') {
      if (process.env.NODE_ENV !== 'test') {
        PropTypes.checkPropTypes(
          // eslint-disable-next-line react/forbid-foreign-prop-types
          this.constructor.propTypes || {},
          newProps,
          'prop',
          this.constructor.name || 'Store'
        );
      }

      // TODO: cannot spread this.props because it reads every property and fails here if they aren't in proptypes
      if (this.constructor.enforcePropTypes) {
        const propTypesKeys = new Set(
          // eslint-disable-next-line react/forbid-foreign-prop-types
          Object.keys(this.constructor.propTypes || {})
        );
        const className = this.constructor.name;

        Object.keys(newProps).forEach(key => {
          if (propTypesKeys.has(key)) {
            return;
          }

          Object.defineProperty(newProps, key, {
            get() {
              throw new Error(
                `${key} not specified in propTypes for ${className}`
              );
            }
          });
        });
      }
    }

    return newProps;
  }
}
