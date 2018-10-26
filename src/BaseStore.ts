import invariant from "invariant";
import { action, computed, observable } from "mobx";
import PropTypes from "prop-types";

interface PropTypes {
  [key: string]: any;
}

interface Props {
  [key: string]: any;
}

type InjectProps = () => Props;

interface ComponentOptions {
  delayBinding: boolean;
}

interface Component {
  props: Props;
}

function isComponentOptions(
  componentOrOptions: Component | ComponentOptions | null | undefined
): componentOrOptions is ComponentOptions {
  if (!componentOrOptions) {
    return false;
  }

  return (
    typeof (componentOrOptions as ComponentOptions).delayBinding === "boolean"
  );
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

  public afterSetup?(): void;

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
    component?: Component | ComponentOptions | null
  ) {
    invariant(
      !injectProps || typeof injectProps === "function",
      "injectProps must be null or a function"
    );

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

    this.injectProps = injectProps || (() => ({}));

    if (isComponentOptions(component)) {
      this.component = null;
      this.storeMetadata.delayBinding = component.delayBinding;
    } else {
      this.component = component;
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

  @action.bound
  public completeSetup() {
    const setupWasComplete = this.storeMetadata.setupComplete;

    this.storeMetadata.setupComplete = true;

    if (!setupWasComplete && typeof this.afterSetup === "function") {
      this.afterSetup();
    }
  }

  @action.bound
  public bindComponent(component: Component | null) {
    this.component = component;
    this.completeSetup();
  }

  @computed
  get componentProps() {
    this.propsMadeObservable; // tslint:disable-line no-unused-expression
    return this.component ? this.component.props : {};
  }

  @computed
  get injectedProps() {
    return this.injectProps();
  }

  @computed
  get defaultProps() {
    return (this.constructor as typeof MobxBaseStore).defaultProps || {};
  }

  @computed
  get props() {
    invariant(
      this.storeMetadata.constructionComplete,
      "Setup must be complete before you can access props. Either you are using new instead of create, or you are accessing props in the constructor instead of afterSetup"
    );

    invariant(
      this.storeMetadata.setupComplete,
      "Setup must be complete before you can access props. Either pass a second argument to create, or call bindComponent"
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

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== "test") {
        PropTypes.checkPropTypes(
          storePropTypes,
          newProps,
          "prop",
          this.constructor.name || "Store"
        );
      }

      // TODO: cannot spread this.props because it reads every property and fails here if they aren't in proptypes
      if (ConstructorClass.enforcePropTypes) {
        const propTypesKeys = new Set(Object.keys(storePropTypes));
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
