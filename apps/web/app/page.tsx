import { Navbar } from "../components/navbar";
import { HeroSection } from "../components/homepage/hero";
import { CategoryGrid } from "../components/homepage/categories";

export default function Page() {
  return (
    <div className="min-h-screen bg-warm-offwhite text-neutral-900">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main>
        {/* Hero Banner Section */}
        <HeroSection />
        
        {/* Stage Essentials: Popular Categories Grid */}
        <CategoryGrid />
      </main>
    </div>
  );
}
