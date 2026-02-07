import { useState, useEffect } from "react";

export function useProjects(user) {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (!user) return;
        const response = await fetch("/api/projects?limit=1000");
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects || []);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    fetchProjects();
  }, [user]);

  return { projects };
}
