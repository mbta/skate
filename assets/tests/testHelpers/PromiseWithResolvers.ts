/**
 * The {@linkcode PromiseWithResolvers} function returns an object containing a
 * new `Promise` object and two functions to `resolve` or `reject` it,
 * corresponding to the two parameters passed to the executor of the `Promise()`
 * constructor.
 *
 * ---
 *
 * Polyfill for [`Promise.withResolvers`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers)
 *
 * Made following the [example implementation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers#description)
 *
 * Deprecate once `Promise.withResolvers` can be used in our test environment.
 */
export const PromiseWithResolvers = <T>(): {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: any) => void
} => {
  let resolve: ((value: T | PromiseLike<T>) => void) | undefined = undefined
  let reject: ((reason?: any) => void) | undefined = undefined
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  if (resolve === undefined || reject === undefined) {
    throw Error("Promise failed to assign `resolve` and/or `reject`")
  }

  return { promise, resolve, reject }
}
