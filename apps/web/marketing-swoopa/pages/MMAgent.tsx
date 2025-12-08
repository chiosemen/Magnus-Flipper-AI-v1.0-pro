import { MMAgentHeader } from "../components/mm-agent/MMAgentHeader";
import { MMAgentHero } from "../components/mm-agent/MMAgentHero";
import { MMAgentObjectives } from "../components/mm-agent/MMAgentObjectives";
import { MMAgentFeatures } from "../components/mm-agent/MMAgentFeatures";
import { MMAgentProcess } from "../components/mm-agent/MMAgentProcess";
import { MMAgentPricing } from "../components/mm-agent/MMAgentPricing";
import { MMAgentTestimonials } from "../components/mm-agent/MMAgentTestimonials";
import { MMAgentCTA } from "../components/mm-agent/MMAgentCTA";
import { MMAgentFooter } from "../components/mm-agent/MMAgentFooter";

const MMAgent = () => {
  return (
    <div className="min-h-screen bg-mm-gradient">
      <MMAgentHeader />
      <MMAgentHero />
      <MMAgentObjectives />
      <MMAgentFeatures />
      <MMAgentProcess />
      <MMAgentPricing />
      <MMAgentTestimonials />
      <MMAgentCTA />
      <MMAgentFooter />
    </div>
  );
};

export default MMAgent;
