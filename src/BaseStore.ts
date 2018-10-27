import invariant from "invariant";
import { action, computed, observable } from "mobx";
import { checkPropTypes } from "prop-types";
import enforcePropTypes from "./enforcePropTypes";
import {
  Component,
  InjectProps,
  Props,
  PropTypes,
  StoreOptions
} from "./types";

function isOptions(
  componentOrOptions: Component | StoreOptions | null | undefined
): componentOrOptions is StoreOptions {
  if (!componentOrOptions) {
    return false;
  }

  return typeof (componentOrOptions as StoreOptions).delayBinding === "boolean";
}

export default class MobxBaseStore {
  public static enforcePropTypes = true;

  public static propTypes?: PropTypes;

  public static defaultProps?: Props;

  @observable
  public storeMetadata = {
    constructionComplete: false,
    delayBinding: false,
    setupComplete: false
  };

  public injectProps: InjectProps;

  @observable
  public component: Component | null | undefined;

  @observable
  public propsMadeObservable = false;

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
    injectProps?: InjectProps | null,
    componentOrOptions?: Component | StoreOptions | null
  ) {
    invariant(
      !injectProps || typeof injectProps === "function",
      "injectProps must be null or a function"
    );

    this.enforceCreateUsage();

    this.injectProps = injectProps || (() => ({}));

    if (isOptions(componentOrOptions)) {
      this.component = null;
      this.storeMetadata.delayBinding = componentOrOptions.delayBinding;
    } else {
      this.component = componentOrOptions;
      this.storeMetadata.delayBinding = false;
    }

    // trigger this on the next tick because components that are marked as observer
    // do not get their props made observable until then, and we need to rerun `props`
    // based on them
    // this is only required with mobx-react < v4.0.0
    setTimeout(() => {
      this.propsMadeObservable = true;
    });
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
    const setupWasComplete = this.storeMetadata.setupComplete;

    this.storeMetadata.setupComplete = true;

    if (!setupWasComplete && typeof this.init === "function") {
      this.init();
    }
  }

  @action.bound
  public bindComponent(component: Component | null) {
    this.component = component;
    this.completeSetup();
  }

  @computed
  public get componentProps() {
    this.propsMadeObservable; // tslint:disable-line no-unused-expression
    return this.component ? this.component.props : {};
  }

  @computed
  public get injectedProps() {
    return this.injectProps();
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
      this.storeMetadata.setupComplete,
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
