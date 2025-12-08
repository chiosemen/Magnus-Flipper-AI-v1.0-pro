import { Button } from "../../components/ui/button";
import { Monitor } from "lucide-react";

export const MMAgentCTA = () => {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="container mx-auto">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-mm-dark mb-6">
              Ready to Automate Your Marketplace Outreach?
            </h2>
            <p className="text-mm-text text-lg mb-8 leading-relaxed">
              Skip the manual work. Let MM Agent validate listings, message sellers, and streamline your sourcing—hands-free.
            </p>
            <Button className="bg-mm-primary hover:bg-mm-primary-dark text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg shadow-mm-primary/30 transition-all hover:shadow-xl hover:-translate-y-0.5">
              Apply for Access
            </Button>
          </div>

          {/* Laptop Mockup */}
          <div className="relative">
            <div className="bg-mm-dark rounded-t-2xl p-2">
              <div className="flex gap-1.5 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="bg-mm-light rounded-lg aspect-video flex items-center justify-center">
                <div className="text-center">
                  <Monitor className="w-16 h-16 text-mm-primary mx-auto mb-4" />
                  <p className="text-mm-dark font-heading font-semibold">MM Agent Dashboard</p>
                  <p className="text-mm-text text-sm">Automating your workflow</p>
                </div>
              </div>
            </div>
            <div className="bg-mm-dark h-4 rounded-b-lg" />
            <div className="bg-gradient-to-b from-mm-dark to-mm-dark/80 h-2 mx-8 rounded-b-lg" />
          </div>
        </div>
      </div>
    </section>
  );
};
