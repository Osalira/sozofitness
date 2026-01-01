import { requireAuth } from "@/lib/auth-helpers";
import Link from "next/link";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  await requireAuth();
  const { session_id } = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-8">
          Thank you for your purchase. Your payment has been processed successfully.
        </p>

        {session_id && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-500 font-mono break-all">Session: {session_id}</p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/client"
            className="block w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium transition-colors"
          >
            Go to Dashboard
          </Link>
          <p className="text-sm text-gray-600">
            You'll receive a confirmation email shortly with your purchase details.
          </p>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> It may take a few moments for your access to be activated. If you
            don't see it immediately, please refresh the page.
          </p>
        </div>
      </div>
    </div>
  );
}
