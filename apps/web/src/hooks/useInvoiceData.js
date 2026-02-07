import { useState, useEffect } from "react";

export function useInvoiceData(user) {
  const [projects, setProjects] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return;

        const [projectsRes, customersRes] = await Promise.all([
          fetch("/api/projects?limit=1000"),
          fetch("/api/customers?limit=1000"),
        ]);

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          setProjects(projectsData.projects || []);
        }

        if (customersRes.ok) {
          const customersData = await customersRes.json();
          setCustomers(customersData.customers || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [user]);

  return { projects, customers };
}
