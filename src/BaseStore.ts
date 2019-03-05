import invariant from 'invariant';
import { action, computed, observable } from 'mobx';
import { checkPropTypes } from 'prop-types';
import enforcePropTypes from './enforcePropTypes';
import extractParams from './extractParams';
import { isObject } from './typeChecking';
import { InjectProps, Props, PropTypes, StoreOptions } from './types';

export default class MobxBaseStore {
  public static enforcePropTypes = true;

  public static propTypes?: PropTypes;

  public static defaultProps?: Props;

  @observable
  private storeMetadata = {
    constructorComplete: false,
    setupComplete: false,
    waitForMoreProps: false
  };

  @observable
  public assignedProps = {};

  private injectProps: InjectProps;

  public init?(): void;

  @action
  public static create(...args: any[]) {
    const SubclassConstructor: any = this;
    const instance: MobxBaseStore = new SubclassConstructor(...args);

    instance.storeMetadata.constructorComplete = true;

    instance.maybeCompleteSetup();

    return instance;
  }

  constructor(
    maybeInjectProps: InjectProps | null = null,
    maybeOptions: StoreOptions | null = null
  ) {
    this.enforceCreateUsage();

    const [injectProps, options] = extractParams(
      maybeInjectProps,
      maybeOptions
    );

    this.injectProps = injectProps;
    this.storeMetadata.waitForMoreProps = options.waitForMoreProps;
  }

  private enforceCreateUsage() {
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'test') {
      setTimeout(() => {
        invariant(
          this.storeMetadata.constructorComplete,
          `Stores should be created with ${
            this.constructor.name
          }.create instead of new ${this.constructor.name}`
        );
      });
    }
  }

  @action.bound
  private maybeCompleteSetup() {
    const { waitForMoreProps, setupComplete } = this.storeMetadata;

    if (waitForMoreProps || setupComplete) {
      return;
    }

    this.storeMetadata.setupComplete = true;

    if (typeof this.init === 'function') {
      this.init();
    }
  }

  @action.bound
  public setProps(
    props: Props,
    maybeOptions: StoreOptions = { waitForMoreProps: false }
  ) {
    invariant(isObject(props), 'props must be a plain object');

    this.storeMetadata.waitForMoreProps = maybeOptions.waitForMoreProps;
    this.assignedProps = props;
    this.maybeCompleteSetup();
  }

  @computed
  public get injectedProps() {
    const injectedProps = this.injectProps();

    invariant(isObject(injectedProps), 'injectProps must return an object');

    return injectedProps;
  }

  @computed
  public get defaultProps() {
    return (this.constructor as typeof MobxBaseStore).defaultProps || {};
  }

  @computed
  public get props(): Props {
    invariant(
      this.storeMetadata.constructorComplete,
      'Setup must be complete before you can access props. Either you are using new instead of create, or you are accessing props in the constructor instead of init'
    );

    invariant(
      this.storeMetadata.setupComplete,
      'Setup must be complete before you can access props. Call setProps without providing waitForMoreProps'
    );

    const newProps = {
      ...this.defaultProps,
      ...this.injectedProps,
      ...this.assignedProps
    };

    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      const ConstructorClass = this.constructor as typeof MobxBaseStore;
      const storePropTypes = ConstructorClass.propTypes || {};
      const storeName = ConstructorClass.name;

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'test') {
        checkPropTypes(storePropTypes, newProps, 'prop', storeName);
      }

      if (ConstructorClass.enforcePropTypes) {
        enforcePropTypes(storePropTypes, newProps, storeName);
      }
    }

    return newProps;
  }
}
