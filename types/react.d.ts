declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any
    }
  }

  interface FormEvent<T = Element> {
    preventDefault(): void
    stopPropagation(): void
    target: EventTarget & T
  }

  interface ChangeEvent<T = Element> {
    preventDefault(): void
    stopPropagation(): void
    target: EventTarget & T
  }

  interface SyntheticEvent<T = Element, E = Event> {
    preventDefault(): void
    stopPropagation(): void
    target: EventTarget & T
  }
}

declare module 'react' {
  export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void]
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void
  export const Fragment: any
  export default React
}

declare module 'react/jsx-runtime' {
  export const Fragment: any
  export const jsx: any
  export const jsxs: any
}
