import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";

export function useQuotationDetail(quotationId) {
  const { data: user, loading: userLoading } = useUser();
  const [userProfile, setUserProfile] = useState(null);
  const [quotation, setQuotation] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile with role
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user) return;

        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data.user);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [user]);

  // Fetch company settings
  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const response = await fetch("/api/settings/company");
        if (response.ok) {
          const data = await response.json();
          setCompanySettings(data.settings);
        }
      } catch (error) {
        console.error("Error fetching company settings:", error);
      }
    };

    fetchCompanySettings();
  }, []);

  // Fetch quotation details
  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/quotations/${quotationId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch quotation");
        }

        const data = await response.json();
        setQuotation(data.quotation);
      } catch (error) {
        console.error("Error fetching quotation:", error);
        setError("Failed to load quotation details");
      } finally {
        setLoading(false);
      }
    };

    if (quotationId && userProfile && companySettings) {
      fetchQuotation();
    }
  }, [quotationId, userProfile, companySettings]);

  return {
    user,
    userLoading,
    userProfile,
    quotation,
    companySettings,
    loading,
    error,
  };
}
