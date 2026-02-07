import * as React from "react";

const useUser = () => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const fetchUser = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile", {
        credentials: "include"
      });
      if (!res.ok) {
        setData(null);
        return;
      }
      const json = await res.json();
      setData(json.user ?? null);
    } catch (e) {
      console.error("useUser: failed to fetch /api/profile", e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user: data,
    data,
    loading,
    refetch: fetchUser,
  };
};

export { useUser };
export default useUser;
