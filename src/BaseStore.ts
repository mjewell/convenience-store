import invariant from "invariant";
import { action, computed, observable } from "mobx";
import { checkPropTypes } from "prop-types";
import enforcePropTypes from "./enforcePropTypes";
import extractParams from "./extractParams";
import { isComponent, isObject } from "./typeChecking";
import {
  Component,
  InjectProps,
  Props,
  PropTypes,
  StoreOptions
} from "./types";

export default class MobxBaseStore {
  public static enforcePropTypes = true;

  public static propTypes?: PropTypes;

  public static defaultProps?: Props;

  @observable
  private storeMetadata = {
    bindingComplete: false,
    constructionComplete: false,
    delayBinding: false,
    propsMadeObservable: false
  };

  private injectProps: InjectProps;

  @observable
  public component: Component | null;

  public init?(): void;

  @action
  public static create(...args: any[]) {
    const SubclassConstructor: any = this;
    const instance: MobxBaseStore = new SubclassConstructor(...args);

    instance.storeMetadata.constructionComplete = true;

    if (!instance.storeMetadata.delayBinding) {
      instance.completeSetup();
    }

    return instance;
  }

  constructor(
    maybeInjectProps: InjectProps | null = null,
    componentOrOptions: Component | StoreOptions | null = null
  ) {
    this.enforceCreateUsage();

    const [injectProps, component, options] = extractParams(
      maybeInjectProps,
      componentOrOptions
    );

    this.injectProps = injectProps;
    this.component = component;
    this.storeMetadata.delayBinding = options.delayBinding;

    // trigger this on the next tick because components that are marked as observer
    // do not get their props made observable until then, and we need to rerun `props`
    // based on them
    // this is only required with mobx-react < v4.0.0
    setTimeout(
      action(() => {
        this.storeMetadata.propsMadeObservable = true;
      })
    );
  }

  private enforceCreateUsage() {
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== "test") {
      setTimeout(() => {
        invariant(
          this.storeMetadata.constructionComplete,
          `Stores should be created with ${
            this.constructor.name
          }.create instead of new ${this.constructor.name}`
        );
      });
    }
  }

  @action.bound
  private completeSetup() {
    const bindingWasComplete = this.storeMetadata.bindingComplete;

    this.storeMetadata.bindingComplete = true;

    if (!bindingWasComplete && typeof this.init === "function") {
      this.init();
    }
  }

  @action.bound
  public bindComponent(component: Component | null) {
    invariant(
      component === null || isComponent(component),
      "component must be null or a component"
    );

    this.component = component;
    this.completeSetup();
  }

  @computed
  public get componentProps() {
    this.storeMetadata.propsMadeObservable; // tslint:disable-line no-unused-expression
    return this.component ? this.component.props : {};
  }

  @computed
  public get injectedProps() {
    const injectedProps = this.injectProps();

    invariant(isObject(injectedProps), "injectProps must return an object");

    return injectedProps;
  }

  @computed
  public get defaultProps() {
    return (this.constructor as typeof MobxBaseStore).defaultProps || {};
  }

  @computed
  public get props() {
    invariant(
      this.storeMetadata.constructionComplete,
      "Binding must be complete before you can access props. Either you are using new instead of create, or you are accessing props in the constructor instead of init"
    );

    invariant(
      this.storeMetadata.bindingComplete,
      "Binding must be complete before you can access props. Either call bindComponent, or do not pass delayBinding"
    );

    const newProps = {
      ...this.defaultProps,
      ...this.injectedProps,
      ...this.componentProps
    };

    /* istanbul ignore else */
    if (process.env.NODE_ENV !== "production") {
      const ConstructorClass = this.constructor as typeof MobxBaseStore;
      const storePropTypes = ConstructorClass.propTypes || {};
      const storeName = ConstructorClass.name;

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== "test") {
        checkPropTypes(storePropTypes, newProps, "prop", storeName);
      }

      if (ConstructorClass.enforcePropTypes) {
        enforcePropTypes(storePropTypes, newProps, storeName);
      }
    }

    return newProps;
  }
}
