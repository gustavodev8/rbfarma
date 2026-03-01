import Header from "@/components/Header";
import QuickAccessIcons from "@/components/QuickAccessIcons";
import HeroBanner from "@/components/HeroBanner";
import BenefitsStrip from "@/components/BenefitsStrip";
import ProductCarousel from "@/components/ProductCarousel";
import CategoryHighlight from "@/components/CategoryHighlight";
import HealthServices from "@/components/HealthServices";
import SiteFooter from "@/components/SiteFooter";
import { useActiveSections } from "@/hooks/useSections";
import { Fragment } from "react";

const Index = () => {
  const sections = useActiveSections();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <QuickAccessIcons />
      <HeroBanner />
      <BenefitsStrip />

      {sections.map((section, index) => (
        <Fragment key={section.id}>
          <ProductCarousel title={section.name} />
          {/* Componentes fixos intercalados em posições específicas */}
          {index === 1 && <CategoryHighlight />}
          {index === 2 && <HealthServices />}
        </Fragment>
      ))}

      <SiteFooter />
    </div>
  );
};

export default Index;
