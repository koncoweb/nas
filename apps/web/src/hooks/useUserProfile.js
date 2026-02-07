import { useState, useEffect } from "react";

export function useUserProfile(user) {
  const [userRole, setUserRole] = useState("sales");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user) return;
        const response = await fetch("/api/profile", {
          credentials: "include"
        });
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.user?.user_role || "sales");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, [user]);

  return { userRole };
}
