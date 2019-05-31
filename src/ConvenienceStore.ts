import invariant from 'invariant';
import { action, computed, observable } from 'mobx';
import { checkPropTypes } from 'prop-types';
import enforcePropTypes from './enforcePropTypes';
import extractParams from './extractParams';
import { isObject } from './typeChecking';
import { InjectProps, PropTypes, StoreOptions } from './types';

export default class ConvenienceStore<Props> {
  public static enforcePropTypes = true;

  public static propTypes?: PropTypes;

  public static defaultProps?: { [key: string]: any }; // TODO: type me

  @observable
  private storeMetadata = {
    constructorComplete: false,
    setupComplete: false,
    waitForMoreProps: false
  };

  @observable
  public assignedProps: Partial<Props> = {};

  private injectProps: InjectProps<Partial<Props>>;

  public init?(): void;

  @action
  public static create<T extends ConvenienceStore<P>, P>(
    this: new (...args: any[]) => T,
    maybeInjectProps: InjectProps<Partial<P>> | null = null,
    maybeOptions: StoreOptions | null = null
  ): T {
    const instance = new this(maybeInjectProps, maybeOptions) as T;

    instance.storeMetadata.constructorComplete = true;

    instance.maybeCompleteSetup();

    return instance;
  }

  public constructor(
    maybeInjectProps: InjectProps<Partial<Props>> | null = null,
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

  private enforceCreateUsage(): void {
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
  private maybeCompleteSetup(): void {
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
    props: Partial<Props>,
    maybeOptions: StoreOptions = { waitForMoreProps: false }
  ): void {
    invariant(isObject(props), 'props must be a plain object');

    this.storeMetadata.waitForMoreProps = maybeOptions.waitForMoreProps;
    this.assignedProps = props;
    this.maybeCompleteSetup();
  }

  @computed
  public get injectedProps(): Partial<Props> {
    const injectedProps = this.injectProps();

    invariant(isObject(injectedProps), 'injectProps must return an object');

    return injectedProps;
  }

  @computed
  public get defaultProps(): { [key: string]: any } {
    return (this.constructor as typeof ConvenienceStore).defaultProps || {};
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
      const ConstructorClass = this.constructor as typeof ConvenienceStore;
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

    return newProps as Props;
  }
}
