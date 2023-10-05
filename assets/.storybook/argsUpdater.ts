// argsUpdater.ts
import { useArgs } from "@storybook/preview-api"
import type { DecoratorFunction, Renderer } from "@storybook/types"

type Fn = (...args: any) => any

/**
 * @example
 * {
 *   decorators: [argsUpdater('btnClicked', () => ({ clicked: true }))]
 * }
 * @see https://github.com/storybookjs/storybook/issues/17089#issuecomment-1704390992
 */
export function argsUpdater<
  TRenderer extends Renderer,
  TArgs extends { [name: string]: any },
  TArgName extends keyof {
    [K in keyof TArgs as Fn extends TArgs[K] ? K : never]: TArgs[K]
  }
>(
  argName: TArgName,
  updater: (
    currentArgs: TArgs,
    ...args: TArgs[TArgName] extends Fn ? Parameters<TArgs[TArgName]> : []
  ) => Partial<TArgs>
): DecoratorFunction<TRenderer, TArgs> {
  return (storyFn, ctx) => {
    const [currentArgs, updateArgs] = useArgs<TArgs>()
    const prevValue = ctx.args[argName]
    ctx.args[argName] = ((...fnArgs: any) => {
      updateArgs(updater(currentArgs, ...fnArgs) as any)
      if (typeof prevValue === "function") {
        return prevValue(...fnArgs)
      }
    }) as TArgs[TArgName]
    return storyFn()
  }
}
