export interface PropTypes {
  [key: string]: any;
}

export type InjectProps<Props> = () => Props;

export interface StoreOptions {
  waitForMoreProps: boolean;
}

export interface Component<Props> {
  props: Props;
}
