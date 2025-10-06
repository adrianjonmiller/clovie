// Minimal, portable macrotask with cancel + AbortSignal
export function queueMacrotask(fn, opts = {}) {
  const { signal, delay = 0, onError } = opts;
  let cancelled = false;

  const run = () => {
    if (cancelled || (signal && signal.aborted)) return;
    try { fn(); } catch (err) {
      if (onError) onError(err);
      else setTimeout(() => { throw err; }, 0);
    }
  };

  const id = typeof setImmediate === 'function'
    ? setImmediate(run)
    : setTimeout(run, delay);

  const cancel = () => {
    cancelled = true;
    if (typeof clearImmediate === 'function') clearImmediate(id);
    else clearTimeout(id);
    if (signal) signal.removeEventListener?.('abort', onAbort);
  };

  const onAbort = () => cancel();
  signal?.addEventListener?.('abort', onAbort, { once: true });

  return cancel;
}

// Minimal microtask with a no-op cancel handle
export function queueMicrotaskSafe(fn, opts = {}) {
  const { signal, onError } = opts;
  let cancelled = false;

  const schedule = typeof queueMicrotask === 'function'
    ? queueMicrotask
    : (cb) => Promise.resolve().then(cb);

  schedule(() => {
    if (cancelled || (signal && signal.aborted)) return;
    try { fn(); } catch (err) {
      if (onError) onError(err);
      else setTimeout(() => { throw err; }, 0);
    }
  });

  const cancel = () => {
    cancelled = true;
    signal?.removeEventListener?.('abort', onAbort);
  };

  const onAbort = () => cancel();
  signal?.addEventListener?.('abort', onAbort, { once: true });

  return cancel; // note: cannot unschedule a microtask, this just no-ops the body
}
