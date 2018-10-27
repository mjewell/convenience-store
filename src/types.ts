export interface PropTypes {
  [key: string]: any;
}

export interface Props {
  [key: string]: any;
}

export type InjectProps = () => Props;

export interface StoreOptions {
  delayBinding: boolean;
}

export interface Component {
  props: Props;
}
