import { Button } from "../../components/ui/button";

export const MMAgentPricing = () => {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="container mx-auto">
        <div className="max-w-2xl mx-auto text-center bg-gradient-to-br from-mm-primary to-mm-primary-dark rounded-3xl p-12 text-white shadow-2xl shadow-mm-primary/30">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Prices start at $199/month
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Fill out the form to learn more about our pricing and get started with MM Agent
          </p>
          <Button className="bg-white text-mm-primary hover:bg-white/90 rounded-full px-8 py-6 text-lg font-semibold shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5">
            Get Details
          </Button>
        </div>
      </div>
    </section>
  );
};
