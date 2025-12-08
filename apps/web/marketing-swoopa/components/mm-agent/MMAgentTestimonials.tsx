import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Neil Loggie",
    text: "I am very pleased with the service provided by Marketplace Monitor. The team consistently goes above and beyond to assist their clients. Thanks to their support, my product sourcing has increased by 70%.",
  },
  {
    name: "Gurnoor Arora",
    title: "MM Has helped me cook!!!",
    text: "First class service! Lightning fast pings and helped me secure items I wouldn't have secured manually! Big up MM! Support team a joy to speak to and ask for help.",
  },
  {
    name: "Karl Polson",
    text: "I was sceptical too begin with but I got a 7 day free trail and I love it. It takes all the stress out snipping deals. It's paid for itself and I've not even finished the trial!",
  },
  {
    name: "Jesse M",
    title: "5 Star Service, 5 Star Product",
    text: "I found these guys through a friend and overnight it changed my business. Fantastic product and even better customer service. Would 100% recommend them to anyone in the reselling game.",
  },
  {
    name: "Peran White",
    text: "Exactly what I needed to help me find listings. Excellent support from the team and constant updates to improve things. Price may seem high but it's worth every penny!",
  },
  {
    name: "Paul Wright",
    text: "Excellent product. Has helped me & my reselling business massively. Great customer support as well. 5 stars. Continue to use marketplace monitor daily.",
  },
];

export const MMAgentTestimonials = () => {
  return (
    <section className="py-20 px-6">
      <div className="container mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-mm-dark text-center mb-4">
          What Our Users Are Saying
        </h2>
        <div className="flex items-center justify-center gap-1 mb-12">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          ))}
          <a
            href="https://uk.trustpilot.com/review/marketplacemonitor.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-mm-primary hover:underline font-medium"
          >
            4.7 Ratings on TrustPilot
          </a>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-mm-border shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              {testimonial.title && (
                <h4 className="font-heading font-bold text-mm-dark mb-2">
                  {testimonial.title}
                </h4>
              )}
              <p className="text-mm-text text-sm leading-relaxed mb-4">
                "{testimonial.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-mm-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-mm-primary font-bold">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <span className="font-medium text-mm-dark">{testimonial.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
