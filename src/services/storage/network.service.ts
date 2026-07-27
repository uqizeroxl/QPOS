type Listener = (online: boolean) => void;

const listeners = new Set<Listener>();

function handleOnline() {
  listeners.forEach((fn) => fn(true));
}

function handleOffline() {
  listeners.forEach((fn) => fn(false));
}

let initialized = false;

function init() {
  if (initialized) return;
  initialized = true;
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
}

export const networkService = {
  isOnline(): boolean {
    return navigator.onLine;
  },

  subscribe(fn: Listener): () => void {
    init();
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
