"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  // Main Contact Form State
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // WhatsApp Modal State
  const [showWaModal, setShowWaModal] = useState(false);
  const [waData, setWaData] = useState({ name: "", email: "", city: "", role: "Customer" });

  // Main Form Submit with Real API Integration
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: `Subject: ${formData.subject}\n\nMessage:\n${formData.message}`,
        }),
      });

      const result = await res.json();

      if (result.success) {
        setSubmitted(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
        setTimeout(() => {
          setSubmitted(false);
        }, 5000);
      } else {
        setErrorMessage(result.error || "Failed to send message.");
      }
    } catch (error) {
      setErrorMessage("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp Form Submit
  const handleWaSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const phoneNumber = "919892455466";
    const message = `Hello India Tour Operators! 👋\n\n*Name:* ${waData.name}\n*Email:* ${waData.email}\n*City:* ${waData.city}\n*I am a:* ${waData.role}\n\nI would like to connect regarding...`;
    const encodedMessage = encodeURIComponent(message);
    
    // Open WhatsApp in new tab
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, "_blank");
    
    // Close modal and reset form
    setShowWaModal(false);
    setWaData({ name: "", email: "", city: "", role: "Customer" });
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans relative">
      
      {/* 🌟 WHATSAPP MODAL POPUP */}
      {showWaModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all max-h-[90vh] overflow-y-auto">
            <div className="bg-emerald-500 p-6 text-white text-center relative">
              <button 
                onClick={() => setShowWaModal(false)}
                className="absolute top-4 right-4 text-emerald-100 hover:text-white font-bold text-xl leading-none"
              >
                ✕
              </button>
              <div className="w-16 h-16 bg-white text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                <svg fill="currentColor" viewBox="0 0 24 24" className="w-8 h-8">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.015c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-black">Connect on WhatsApp</h2>
              <p className="text-emerald-100 text-sm mt-1">Please provide your details to continue</p>
            </div>
            
            <form onSubmit={handleWaSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                  placeholder="e.g. Rahul Sharma"
                  value={waData.name}
                  onChange={(e) => setWaData({...waData, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                  placeholder="e.g. rahul@example.com"
                  value={waData.email}
                  onChange={(e) => setWaData({...waData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">City</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                  placeholder="e.g. Mumbai"
                  value={waData.city}
                  onChange={(e) => setWaData({...waData, city: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">I am a...</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setWaData({...waData, role: "Customer"})}
                    className={`py-3 px-4 rounded-xl font-bold text-sm border transition-all ${waData.role === "Customer" ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                  >
                    👤 Customer
                  </button>
                  <button 
                    type="button"
                    onClick={() => setWaData({...waData, role: "Vendor"})}
                    className={`py-3 px-4 rounded-xl font-bold text-sm border transition-all ${waData.role === "Vendor" ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                  >
                    🤝 Vendor
                  </button>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowWaModal(false)}
                  className="w-1/3 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-2/3 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98]"
                >
                  Continue to Chat 💬
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-900 text-white p-8 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-10 w-72 h-72 bg-amber-500 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-5xl font-black mb-4">Contact Us</h1>
            <p className="text-blue-200 font-medium text-lg max-w-2xl mx-auto">
              Have a question about a tour package, cab booking, or need help planning your trip? We're here to help 24/7.
            </p>
          </div>
        </div>

        <div className="p-8 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Contact Information Left Side */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-6">Get in Touch</h2>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  Whether you are looking for a customized holiday package, reliable outstation cabs, or have a business inquiry, feel free to reach out. Our travel experts will get back to you shortly.
                </p>
              </div>

              <div className="space-y-6">
                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    📞
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">Phone Number</h4>
                    <p className="text-slate-600 mt-1">+91 98924 55466</p>
                    <p className="text-slate-500 text-sm mt-1">Available 24/7 for support</p>
                  </div>
                </div>

                {/* WhatsApp Trigger */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg fill="currentColor" viewBox="0 0 24 24" className="w-7 h-7">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.015c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">WhatsApp</h4>
                    <p className="text-slate-600 mt-1">+91 98924 55466</p>
                    <button 
                      onClick={() => setShowWaModal(true)} 
                      className="text-emerald-600 font-bold text-sm mt-1 inline-block hover:underline"
                    >
                      Click to Chat &rarr;
                    </button>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    ✉️
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">Email Address</h4>
                    <p className="text-slate-600">rajtours14@gmail.com</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    📍
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">Head Office</h4>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      Mumbai, Maharashtra<br />
                      India
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="pt-8 border-t border-slate-100">
                <p className="font-bold text-slate-800 mb-4">Follow us on Social Media</p>
                <div className="flex gap-4">
                  <a href="#" aria-label="Facebook" className="w-10 h-10 bg-slate-100 text-slate-500 hover:bg-blue-100 hover:text-blue-600 rounded-full flex items-center justify-center transition-colors">
                    <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" aria-label="Instagram" className="w-10 h-10 bg-slate-100 text-slate-500 hover:bg-pink-100 hover:text-pink-600 rounded-full flex items-center justify-center transition-colors">
                    <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" aria-label="YouTube" className="w-10 h-10 bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600 rounded-full flex items-center justify-center transition-colors">
                    <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                      <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form Right Side */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-6">Send us a Message</h3>
              
              {submitted ? (
                <div className="bg-green-100 border border-green-200 text-green-800 p-6 rounded-2xl text-center">
                  <div className="text-4xl mb-4">✅</div>
                  <h4 className="font-bold text-lg mb-2">Message Sent Successfully!</h4>
                  <p className="text-sm">Thank you for contacting us. Our team will get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="e.g. rahul@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Subject</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="e.g. Inquiry about Kerala Tour"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Message</label>
                    <textarea 
                      required 
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                      placeholder="Write your query here..."
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                    ></textarea>
                  </div>

                  {errorMessage && (
                    <p className="text-red-600 text-sm font-semibold">{errorMessage}</p>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? "Sending Message..." : "Send Message 🚀"}
                  </button>
                </form>
              )}
            </div>

          </div>

          <div className="mt-12 pt-8 border-t text-center">
            <Link href="/" className="text-blue-600 font-bold hover:underline">
              &larr; Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}