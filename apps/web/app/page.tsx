import { Navbar } from "../components/navbar";
import { HeroSection } from "../components/homepage/hero";
import { CategoryGrid } from "../components/homepage/categories";
import { HomeClient } from "../components/homepage/home-client";
import { BeginnerCollection } from "../components/homepage/beginner-collection";

export default function Page() {
  return (
    <div className="min-h-screen bg-warm-offwhite text-neutral-900">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main>
        {/* Hero Banner Section */}
        <HeroSection />
        
        {/* Bundle Sets & Beginner Recommendations */}
        <HomeClient />

        {/* Beginner Collection – Category cards, filter toolbar, product grid */}
        <BeginnerCollection />
        
        {/* Stage Essentials: Popular Categories Grid */}
        <CategoryGrid />
      </main>
    </div>
  );
}
