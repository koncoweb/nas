export function AlertMessage({ type, message }) {
  if (!message) return null;

  const isSuccess = type === "success";
  const bgColor = isSuccess ? "bg-accent-50" : "bg-red-50";
  const borderColor = isSuccess ? "border-accent-200" : "border-red-200";
  const textColor = isSuccess ? "text-accent-700" : "text-red-700";
  const iconColor = isSuccess ? "text-green-400" : "text-red-400";

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4 mb-6`}>
      <div className="flex">
        {isSuccess ? (
          <svg
            className={`w-5 h-5 ${iconColor} mr-2`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            className={`w-5 h-5 ${iconColor} mr-2`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        )}
        <span className={textColor}>{message}</span>
      </div>
    </div>
  );
}
