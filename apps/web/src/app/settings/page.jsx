import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import { Building, Save, Upload } from "lucide-react";

function SettingsPage() {
  const { data: user, loading: userLoading } = useUser();
  const [userProfile, setUserProfile] = useState(null);
  const [settings, setSettings] = useState({
    company_name: "PT. NATA AIR SAGARA",
    company_tagline: "HVAC SERVICE SPECIALIST",
    address_line1: "Jl. Gajah Mada – Tiban Baru",
    address_line2: "Ruko Onassis Blok A No. 05",
    address_line3: "Tiban Baru – Batam",
    phone: "Tlp. 0778 8011360",
    email: "info@nataairsagara.com",
    director_name: "Cucup Supriatna",
    director_title: "Commercial Manager",
    director_email: "cucup@nataairsagara.com",
    director_phone: "+62 81270121383",
    director_did: "+62 778 8011360",
    logo_url: "",
    // New: global full-page letterhead background image URL
    letterheadBackgroundUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch user profile
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
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings/company");
        if (response.ok) {
          const data = await response.json();
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings/company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage("Settings saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Error saving settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage("Error saving settings");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (userLoading || !userProfile) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  const userRole = userProfile?.user_role || "sales";
  const canEdit = userRole === "leader";

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <header className="bg-white border-b border-neutral-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <a href="/" className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg mr-3">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-xl font-bold text-neutral-900">
                    HVAC Manager
                  </h1>
                </a>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Access Denied
            </h3>
            <p className="text-red-700">
              Only leaders can access company settings.
            </p>
            <a
              href="/"
              className="text-primary-600 hover:text-primary-700 font-medium mt-4 inline-block"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/" className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg mr-3">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-neutral-900">
                  HVAC Manager
                </h1>
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-neutral-600">
                {userProfile?.name || userProfile?.email}
              </span>
              <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full capitalize">
                {userRole}
              </span>
              <a
                href="/account/logout"
                className="text-neutral-500 hover:text-neutral-700 text-sm font-medium"
              >
                Sign Out
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-neutral-900">Company Settings</h2>
          <p className="text-neutral-600 mt-2">
            Manage company information for quotations and documents
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes("Error")
                ? "bg-red-50 border border-red-200 text-red-700"
                : "bg-accent-50 border border-accent-200 text-accent-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Company Information */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-6">
                Company Information
              </h3>

              <div className="space-y-4">
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={settings.company_name}
                    onChange={(e) =>
                      handleInputChange("company_name", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="PT. NATA AIR SAGARA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Company Tagline
                  </label>
                  <input
                    type="text"
                    value={settings.company_tagline}
                    onChange={(e) =>
                      handleInputChange("company_tagline", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="HVAC SERVICE SPECIALIST"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    value={settings.address_line1}
                    onChange={(e) =>
                      handleInputChange("address_line1", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Jl. Gajah Mada – Tiban Baru"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={settings.address_line2}
                    onChange={(e) =>
                      handleInputChange("address_line2", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ruko Onassis Blok A No. 05"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Address Line 3
                  </label>
                  <input
                    type="text"
                    value={settings.address_line3}
                    onChange={(e) =>
                      handleInputChange("address_line3", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Tiban Baru – Batam"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Tlp. 0778 8011360"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="info@nataairsagara.com"
                  />
                </div>
              </div>
            </div>

            {/* Director Information */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-6">
                Director Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Director Name
                  </label>
                  <input
                    type="text"
                    value={settings.director_name}
                    onChange={(e) =>
                      handleInputChange("director_name", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Cucup Supriatna"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Director Title
                  </label>
                  <input
                    type="text"
                    value={settings.director_title}
                    onChange={(e) =>
                      handleInputChange("director_title", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Commercial Manager"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Director Email
                  </label>
                  <input
                    type="email"
                    value={settings.director_email}
                    onChange={(e) =>
                      handleInputChange("director_email", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="cucup@nataairsagara.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Director Mobile
                  </label>
                  <input
                    type="text"
                    value={settings.director_phone}
                    onChange={(e) =>
                      handleInputChange("director_phone", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="+62 81270121383"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Director DID
                  </label>
                  <input
                    type="text"
                    value={settings.director_did}
                    onChange={(e) =>
                      handleInputChange("director_did", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="+62 778 8011360"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Company Logo URL
                  </label>
                  <input
                    type="url"
                    value={settings.logo_url}
                    onChange={(e) =>
                      handleInputChange("logo_url", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                {/* NEW: Letterhead Background URL */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Letterhead Background URL (A4 image – header+footer)
                  </label>
                  <input
                    type="url"
                    value={settings.letterheadBackgroundUrl}
                    onChange={(e) =>
                      handleInputChange(
                        "letterheadBackgroundUrl",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://example.com/letterhead-a4.png"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Gunakan gambar A4 (1240×1754px atau 2480×3508px). Kompres
                    agar &lt; 4.5MB.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-5 h-5 mr-2" />
              {loading ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
