import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | India Tour Operators",
  description: "Learn how we collect, use, and protect the personal data of our travelers and vendor partners.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-8 md:p-12 text-center">
          <h1 className="text-3xl md:text-5xl font-black mb-4">Privacy Policy</h1>
          <p className="text-slate-300 font-medium">Protecting the data of our Travelers and Partners.</p>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 space-y-8 text-slate-600 leading-relaxed">
          
          <section>
            <p>
              At <strong>India Tour Operators</strong>, we respect your privacy and are committed to protecting the personal and business information you share with us. This Privacy Policy outlines how we collect, use, and safeguard your data, whether you are a traveler booking a trip or a vendor listing your services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4 border-b pb-2">1. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-800">For Travelers (Customers):</h3>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Personal Details:</strong> Name, email address, phone number, and billing information provided during the booking process.</li>
                  <li><strong>Trip Information:</strong> Pickup/drop locations, travel dates, and special preferences.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-slate-800">For Partners (Vendors/Travel Agents):</h3>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Business Details:</strong> Agency name, contact information, and operating locations.</li>
                  <li><strong>KYC & Legal Documents:</strong> Government IDs, business licenses, bank account details for payouts, and vehicle registration details.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Automatically Collected Data:</h3>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>IP address, browser type, cookies, and website interaction data to improve our platform's user experience.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4 border-b pb-2">2. How We Use Your Information</h2>
            <p>The information we collect is strictly used to:</p>
            <ul className="list-disc pl-5 mt-4 space-y-2">
              <li>Process bookings, payments, and vendor payouts efficiently.</li>
              <li>Verify vendor identities (KYC) to maintain a secure and trustworthy platform.</li>
              <li>Share essential trip details (like driver contact info) with travelers before their journey.</li>
              <li>Provide customer support and resolve any disputes between travelers and vendors.</li>
              <li>Send important updates, booking confirmations, and promotional offers (with an opt-out option).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4 border-b pb-2">3. How We Share Your Data</h2>
            <p>We do not sell or rent your personal information to third parties. Data sharing is limited to:</p>
            <ul className="list-disc pl-5 mt-4 space-y-2">
              <li><strong>Service Fulfillment:</strong> Sharing traveler contact details with the assigned local vendor/driver, and vice versa, solely for executing the booked trip.</li>
              <li><strong>Legal Compliance:</strong> Disclosing information to law enforcement agencies if required by law or to protect against fraudulent activities.</li>
              <li><strong>Third-Party Services:</strong> Secure payment gateways and SMS/Email service providers that facilitate platform operations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4 border-b pb-2">4. Data Security & Retention</h2>
            <p>
              We implement industry-standard encryption and security protocols to protect your personal and KYC data from unauthorized access. We retain your information only as long as your account is active or as legally necessary for accounting and compliance purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4 border-b pb-2">5. Your Rights & Contact Us</h2>
            <p>
              You have the right to review, update, or request the deletion of your personal or business data from our platform. If you have any questions or concerns regarding this Privacy Policy, please contact our Data Protection team:
            </p>
            <div className="mt-4 bg-slate-100 p-4 rounded-xl inline-block">
              <p><strong>Email:</strong> rajtours14@gmail.com</p>
              <p><strong>Phone:</strong> +91 98924 55466</p>
            </div>
          </section>

          <div className="pt-8 border-t flex justify-between items-center">
            <Link href="/" className="text-slate-900 font-bold hover:underline">
              &larr; Back to Home
            </Link>
            <Link href="/terms" className="text-blue-600 font-bold hover:underline">
              Read Vendor Terms &rarr;
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}