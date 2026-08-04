import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy | India Tour Operators",
  description: "Understand our cancellation fees, refund process, and policy for cab and tour bookings.",
};

export default function CancellationPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-orange-600 text-white p-8 md:p-12 text-center">
          <h1 className="text-3xl md:text-5xl font-black mb-4">Cancellation Policy</h1>
          <p className="text-orange-100 font-medium">Transparent refund and cancellation rules</p>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 space-y-8 text-slate-600 leading-relaxed">
          
          <section>
            <p className="text-lg">
              We understand that travel plans can change. To keep things fair for both our travelers and our local travel partners, we have established the following transparent cancellation policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-b pb-2">Cancellation Charges</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-200 rounded-lg">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="p-4 border border-slate-200 font-bold">Time Before Departure</th>
                    <th className="p-4 border border-slate-200 font-bold">Cancellation Fee</th>
                    <th className="p-4 border border-slate-200 font-bold">Refund Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-4 border border-slate-200 font-medium">30 to 15 Days</td>
                    <td className="p-4 border border-slate-200 text-green-600 font-bold">0%</td>
                    <td className="p-4 border border-slate-200">100% Refund</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-4 border border-slate-200 font-medium">15 to 7 Days</td>
                    <td className="p-4 border border-slate-200 text-orange-600 font-bold">25% of total amount</td>
                    <td className="p-4 border border-slate-200">75% Refund</td>
                  </tr>
                  <tr>
                    <td className="p-4 border border-slate-200 font-medium">Less than 7 to 2 Days</td>
                    <td className="p-4 border border-slate-200 text-red-500 font-bold">50% of total amount</td>
                    <td className="p-4 border border-slate-200">50% Refund</td>
                  </tr>
                  <tr className="bg-red-50">
                    <td className="p-4 border border-slate-200 font-medium text-red-700">Less than 48 Hours</td>
                    <td className="p-4 border border-slate-200 text-red-700 font-bold">100% of total amount</td>
                    <td className="p-4 border border-slate-200 text-red-700 font-bold">No Refund</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <h3 className="text-lg font-black text-blue-900 mb-2">Important Note on Driver Details</h3>
            <p className="text-blue-800">
              Your driver and cab details will be provided <strong>one day prior to your trip, before 6:00 AM</strong>. Cancellations made after driver assignment within the 48-hour window will not be eligible for any refunds.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4 border-b pb-2">Refund Processing</h2>
            <p>
              Approved refunds will be processed within 5 to 7 business days to the original payment method used during booking.
            </p>
          </section>

          <div className="pt-8 border-t">
            <Link href="/" className="text-orange-600 font-bold hover:underline">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}