declare module 'react-window' {
  import { ComponentType, ReactNode, CSSProperties } from 'react';

  export interface ListChildComponentProps {
    index: number;
    style: CSSProperties;
    data: any;
  }

  export interface FixedSizeListProps {
    children: ComponentType<ListChildComponentProps>;
    height: number | string;
    itemCount: number;
    itemSize: number;
    width?: number | string;
    itemData?: any;
    className?: string;
    style?: CSSProperties;
  }

  export interface VariableSizeListProps {
    children: ComponentType<ListChildComponentProps>;
    height: number | string;
    itemCount: number;
    itemSize: (index: number) => number;
    width?: number | string;
    itemData?: any;
    className?: string;
    style?: CSSProperties;
  }

  export const FixedSizeList: ComponentType<FixedSizeListProps>;
  export const VariableSizeList: ComponentType<VariableSizeListProps>;
} 