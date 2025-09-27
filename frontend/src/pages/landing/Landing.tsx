import DemoPage from "./faq/Faq";
import FeaturesPage from "./features/FeaturesPage";
import Footer from "./footer/Footer";
import { HeroPage } from "./hero/HeroPage";

const Landing = () => {
  return (
    <div className="p-0 m-0">
      <main className="p-0 m-0">
        <HeroPage  />
        <FeaturesPage/>
        <DemoPage/>
        <Footer/>
      </main>
    </div>
  );
};

export default Landing;
