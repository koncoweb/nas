import { useState, useEffect } from "react";

export function useMaterialRequestDetail(requestId, userProfile) {
  const [materialRequest, setMaterialRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMaterialRequest = async () => {
      try {
        if (!userProfile) {
          console.log("useMaterialRequestDetail: waiting for userProfile");
          return;
        }

        if (!requestId) {
          console.error("useMaterialRequestDetail: requestId is missing");
          setError("Request ID is missing");
          setLoading(false);
          return;
        }

        console.log("useMaterialRequestDetail: fetching request", {
          requestId,
          userEmail: userProfile?.email || null,
        });

        setLoading(true);
        setError(null); // Clear previous errors

        const url = `/api/material-requests/${requestId}`;
        console.log("useMaterialRequestDetail: fetching from", url);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies for authentication
        });

        console.log(
          "useMaterialRequestDetail: response status",
          response.status,
        );

        if (!response.ok) {
          // Try to get error details from response
          let errorMessage = `Failed to fetch material request`;
          try {
            const errorData = await response.json();
            console.error(
              "useMaterialRequestDetail: error response",
              errorData,
            );
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            // If response isn't JSON, use status text
            console.error(
              "useMaterialRequestDetail: failed to parse error response",
              parseError,
            );
            errorMessage = `${errorMessage} (${response.status} ${response.statusText})`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("useMaterialRequestDetail: success", data);
        setMaterialRequest(data.material_request);
      } catch (err) {
        console.error("useMaterialRequestDetail: catch block error", err);
        console.error("Error details:", {
          name: err.name,
          message: err.message,
          stack: err.stack,
        });

        // Provide more helpful error messages
        let userMessage = err.message;
        if (err.message === "Failed to fetch") {
          userMessage =
            "Unable to connect to server. Please check your connection and try refreshing the page.";
        } else if (err.name === "TypeError" && err.message.includes("fetch")) {
          userMessage =
            "Network error occurred. Please check your internet connection and try again.";
        }

        setError(userMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterialRequest();
    // Only re-run when the requestId changes or the user's role changes; avoid object identity loops
  }, [requestId, userProfile?.user_role]);

  return { materialRequest, loading, error, setMaterialRequest };
}
