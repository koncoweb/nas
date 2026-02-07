export function useRouter() {
  if (typeof window === "undefined") {
    return {
      push: () => {},
      back: () => {},
      forward: () => {},
      refresh: () => {},
      replace: () => {},
    };
  }

  return {
    push: (url) => {
      window.location.href = url;
    },
    back: () => {
      window.history.back();
    },
    forward: () => {
      window.history.forward();
    },
    refresh: () => {
      window.location.reload();
    },
    replace: (url) => {
      window.location.replace(url);
    },
  };
}
