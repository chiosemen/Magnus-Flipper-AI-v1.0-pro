import { MessageSquare, Shield, DollarSign, Settings } from "lucide-react";

const objectives = [
  {
    icon: MessageSquare,
    title: "Never Miss a Deal",
    description: "Send instant messages to new listings without lifting a finger",
    highlight: 'Message: "Sold, I can take this right away and have cash ready!"',
  },
  {
    icon: Shield,
    title: "Improve Quality Control",
    description: "Block new accounts and known resellers in your area",
    highlight: null,
  },
  {
    icon: DollarSign,
    title: "Start Negotiation",
    description: "Send negotiation messages with automatic model identification and pricing sheet integration",
    highlight: null,
  },
  {
    icon: Settings,
    title: "Maintain Flexibility",
    description: "Fully customize pricing thresholds, message templates and blocklists to suit your needs",
    highlight: null,
  },
];

export const MMAgentObjectives = () => {
  return (
    <section id="objectives" className="py-20 px-6">
      <div className="container mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-mm-dark text-center mb-16">
          What MM Agent Helps You Achieve
        </h2>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {objectives.map((obj, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 border border-mm-border shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-mm-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-mm-primary/20 transition-colors">
                  <obj.icon className="w-7 h-7 text-mm-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-mm-dark mb-2">
                    {obj.title}
                  </h3>
                  <p className="text-mm-text leading-relaxed">
                    {obj.description}
                  </p>
                  {obj.highlight && (
                    <div className="mt-4 bg-mm-light rounded-lg p-3 border border-mm-border">
                      <p className="text-sm text-mm-dark italic">{obj.highlight}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
