import { MMAgentHeader } from "@swoopa/components/mm-agent/MMAgentHeader";
import { MMAgentHero } from "@swoopa/components/mm-agent/MMAgentHero";
import { MMAgentObjectives } from "@swoopa/components/mm-agent/MMAgentObjectives";
import { MMAgentFeatures } from "@swoopa/components/mm-agent/MMAgentFeatures";
import { MMAgentProcess } from "@swoopa/components/mm-agent/MMAgentProcess";
import { MMAgentPricing } from "@swoopa/components/mm-agent/MMAgentPricing";
import { MMAgentTestimonials } from "@swoopa/components/mm-agent/MMAgentTestimonials";
import { MMAgentCTA } from "@swoopa/components/mm-agent/MMAgentCTA";
import { MMAgentFooter } from "@swoopa/components/mm-agent/MMAgentFooter";

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
