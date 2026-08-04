import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vendor Terms and Conditions | India Tour Operators",
  description: "Read the terms and conditions for travel agents, cab providers, and hotel partners listing their services on India Tour Operators.",
};

export default function VendorTermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-900 text-white p-8 md:p-12 text-center">
          <h1 className="text-3xl md:text-5xl font-black mb-4">Vendor Terms & Conditions</h1>
          <p className="text-blue-200 font-medium">For Travel Agents, Cab Providers & Partners</p>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 space-y-8 text-slate-600 leading-relaxed">
          
          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4 border-b pb-2">1. Partner Registration & KYC</h2>
            <p>Welcome to the India Tour Operators Partner Network. By registering as a vendor and listing your services, you agree to the following:</p>
            <ul className="list-disc pl-5 mt-4 space-y-2">
              <li><strong>Accurate Details:</strong> You must provide accurate business details, contact information, and valid KYC documents. Any discrepancies may lead to immediate account suspension.</li>
              <li><strong>Approval Process:</strong> All new listings and vendor accounts are subject to approval by our admin team to maintain quality standards.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4 border-b pb-2">2. Listing & Pricing Transparency</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>No Hidden Charges:</strong> The prices listed on our portal must be final. Vendors are strictly prohibited from demanding hidden charges or extra platform fees from customers at the time of the trip.</li>
              <li><strong>Accurate Inclusions/Exclusions:</strong> You must clearly specify what is included (e.g., tolls, parking, driver DA) and excluded in your cab and tour listings.</li>
              <li><strong>Price Parity:</strong> We expect our partners to offer competitive pricing that matches or is lower than standard market rates to ensure better conversions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4 border-b pb-2">3. Service Fulfillment & Quality</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Driver & Vehicle Details:</strong> It is your absolute responsibility to provide the customer with the assigned cab and driver details <strong>at least one day prior to the trip, before 6:00 AM</strong>.</li>
              <li><strong>Vehicle Condition:</strong> Vehicles provided must be well-maintained, clean, and match the category booked by the customer (e.g., if a Sedan is booked, a Hatchback cannot be sent).</li>
              <li><strong>Professionalism:</strong> Drivers and guides must behave professionally and respectfully with customers. Misbehavior will result in strict action.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4 border-b pb-2">4. Cancellations & Refund Compliance</h2>
            <p>
              Vendors must strictly adhere to the official Cancellation Policy displayed on the India Tour Operators website. If a customer cancels a booking within the permitted free-cancellation window, the vendor must process the refund without any deductions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4 border-b pb-2">5. Account Suspension & Termination</h2>
            <p>
              India Tour Operators reserves the right to suspend or permanently ban any vendor account without prior notice if we observe:
            </p>
            <ul className="list-disc pl-5 mt-4 space-y-2">
              <li>Repeated customer complaints or low ratings.</li>
              <li>Fraudulent activities, fake listings, or bait-and-switch pricing tactics.</li>
              <li>Failure to provide the service after a confirmed booking.</li>
            </ul>
          </section>

          <div className="pt-8 border-t">
            <Link href="/" className="text-blue-600 font-bold hover:underline">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}