import { SmoothScroll } from "@/components/animations/SmoothScroll";
import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Agents } from "@/components/landing/Agents";
import { Proof } from "@/components/landing/Proof";
import { Mentors } from "@/components/landing/Mentors";
import { Stories } from "@/components/landing/Stories";
import { Network } from "@/components/landing/Network";
import { Join } from "@/components/landing/Join";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <SmoothScroll>
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <Agents />
        <Proof />
        <Mentors />
        <Stories />
        <Network />
        <Join />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
