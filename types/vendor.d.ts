/**
 * Vendor ambient module declarations
 *
 * These stubs cover packages whose published TypeScript declarations are not
 * resolvable under `moduleResolution: "bundler"` in this environment:
 *
 *   - zod@3.25.76  — ships `./index.d.cts` in its exports map but the file
 *                    is absent from the installed package, so tsc falls back
 *                    to the untyped `index.cjs`.  TODO: remove once the zod
 *                    package ships a proper root declaration.
 *
 *   - @aws-sdk/client-secrets-manager — now declared as an optionalDependency
 *                    in package.json (#595). The ambient stub below is retained
 *                    as a fallback for environments where the package is not
 *                    installed; `lib/secrets/aws-backend.ts` wraps the dynamic
 *                    import in a try/catch so a missing package fails at runtime
 *                    with a clear install message rather than at compile time.
 *                    Remove this stub once the package is pinned as a regular
 *                    dependency.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'zod' {
  // Type-level: z.infer<Schema> resolves to any so existing code compiles.
  // `infer` is a contextual keyword only inside conditional types — it is a
  // valid exported identifier here.
  export type infer<_T> = any;

  // Runtime constructors — all return any so chained calls (.min, .email …)
  // are accepted without further declarations.
  export const object: (...args: any[]) => any;
  export const string: (...args: any[]) => any;
  export const number: (...args: any[]) => any;
  export const boolean: (...args: any[]) => any;
  export const array: (...args: any[]) => any;
  export const union: (...args: any[]) => any;
  export const literal: (...args: any[]) => any;
  export const optional: (...args: any[]) => any;
  export const record: (...args: any[]) => any;
  export const tuple: (...args: any[]) => any;
  export const discriminatedUnion: (...args: any[]) => any;
  export const intersection: (...args: any[]) => any;
  export const coerce: any;
  export const ZodError: any;
}

// Fallback stub — only active when the optional package is not installed.
// When `bun add @aws-sdk/client-secrets-manager` is run, the package's own
// declarations take precedence and this stub becomes unreachable.
declare module '@aws-sdk/client-secrets-manager' {
  export class SecretsManagerClient {
    constructor(config: { region: string });
    send(command: any): Promise<any>;
  }
  export class GetSecretValueCommand {
    constructor(input: { SecretId: string });
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

