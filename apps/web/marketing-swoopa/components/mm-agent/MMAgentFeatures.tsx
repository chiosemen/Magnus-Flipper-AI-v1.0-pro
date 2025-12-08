import { Shield, MessageSquare, Smartphone, DollarSign, Clock, FileText } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Spam/Reseller Detection",
    description: "Instantly check against blocked sellers and spam accounts",
  },
  {
    icon: MessageSquare,
    title: "Automated Messaging",
    description: "Send messages to approved listings as soon as they're posted",
  },
  {
    icon: Smartphone,
    title: "Device Identification",
    description: "Automatically detect the listed device to tailor messages and offers",
  },
  {
    icon: DollarSign,
    title: "Customizable Pricing Config",
    description: "Send specific offers depending on the model and list price",
  },
  {
    icon: Clock,
    title: "Hands-Free Workflow",
    description: "Runs 24/7 on your computer, meaning you never miss a listing",
  },
  {
    icon: FileText,
    title: "Tailored Messages",
    description: "Set up message templates so it fits your style",
  },
];

export const MMAgentFeatures = () => {
  return (
    <section id="features" className="py-20 px-6 bg-white">
      <div className="container mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-mm-dark text-center mb-4">
          Powerful Features Built for Efficiency
        </h2>
        <p className="text-mm-text text-center mb-16 max-w-2xl mx-auto">
          Everything you need to automate your marketplace sourcing workflow
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-mm-light rounded-2xl p-6 border border-mm-border hover:border-mm-primary/30 transition-all hover:shadow-lg group"
            >
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                <feature.icon className="w-6 h-6 text-mm-primary" />
              </div>
              <h3 className="font-heading text-lg font-bold text-mm-dark mb-2">
                {feature.title}
              </h3>
              <p className="text-mm-text text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
