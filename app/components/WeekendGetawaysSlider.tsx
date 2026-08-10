"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

// 🌟 12 SEO-OPTIMIZED WEEKEND DESTINATIONS FROM MUMBAI
const weekendGetaways = [
  { 
    title: "Lonavala", 
    image: "https://images.unsplash.com/photo-1589182373726-e4f658ab50f4?w=600&q=80", 
    link: "/search?service=tour&destination=Lonavala" 
  },
  { 
    title: "Alibag", 
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80", 
    link: "/search?service=tour&destination=Alibag" 
  },
  { 
    title: "Pune", 
    image: "https://images.unsplash.com/photo-1552832233-4f9660231862?w=600&q=80", 
    link: "/search?service=tour&destination=Pune" 
  },
  { 
    title: "Mahabaleshwar", 
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80", 
    link: "/search?service=tour&destination=Mahabaleshwar" 
  },
  { 
    title: "Igatpuri", 
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80", 
    link: "/search?service=tour&destination=Igatpuri" 
  },
  { 
    title: "Matheran", 
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&q=80", 
    link: "/search?service=tour&destination=Matheran" 
  },
  { 
    title: "Nashik", 
    image: "https://images.unsplash.com/photo-1586520338780-e747b0a70191?w=600&q=80", 
    link: "/search?service=tour&destination=Nashik" 
  },
  { 
    title: "Bhimashankar", 
    image: "https://images.unsplash.com/photo-1610052329383-a75e3c1537b0?w=600&q=80", 
    link: "/search?service=tour&destination=Bhimashankar" 
  },
  { 
    title: "Bhandardara", 
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80", 
    link: "/search?service=tour&destination=Bhandardara" 
  },
  { 
    title: "Shirdi", 
    image: "https://images.unsplash.com/photo-1605389659473-b3c4ba7e4a64?w=600&q=80", 
    link: "/search?service=tour&destination=Shirdi" 
  },
  { 
    title: "Jawhar", 
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80", 
    link: "/search?service=tour&destination=Jawhar" 
  },
  { 
    title: "Trimbakeshwar", 
    image: "https://images.unsplash.com/photo-1621235123985-797746cb96da?w=600&q=80", 
    link: "/search?service=tour&destination=Trimbakeshwar" 
  }
];

export default function WeekendGetawaysSlider() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // 🌟 AUTOMOTION (AUTO-SCROLL) LOGIC
  useEffect(() => {
    const slider = scrollRef.current;
    if (!slider) return;

    const interval = setInterval(() => {
      if (!isHovered && slider) {
        const maxScrollLeft = slider.scrollWidth - slider.clientWidth;
        
        // Agar slider end tak pahunch jaye toh wapas starting mein aaye
        if (slider.scrollLeft >= maxScrollLeft - 10) {
          slider.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          slider.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 3000); // Har 3 Seconds me auto-scroll hoga

    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <section className="bg-slate-100 py-16 px-4 md:px-8 border-t border-slate-200">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-8 text-center md:text-left flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-2">🚗 Weekend Getaways From Mumbai</h2>
            <p className="text-slate-600 font-medium">Top 12 short trips and customized packages for your weekend escape.</p>
          </div>
          <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full flex items-center gap-1">
            ⚡ Auto-sliding (Hover to Pause)
          </span>
        </div>
        
        {/* 🌟 AUTO SCROLLING SLIDER CONTAINER */}
        <div 
          ref={scrollRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory scroll-smooth"
        >
          {weekendGetaways.map((item, index) => (
            <Link 
              href={item.link} 
              key={index} 
              className="min-w-[260px] md:min-w-[290px] group relative h-56 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 snap-start shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={item.image} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="font-black text-lg tracking-wide">{item.title}</h3>
                <span className="text-xs font-bold text-amber-400 mt-1 block group-hover:translate-x-1 transition-transform">Explore Packages →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}