import { Button } from "@swoopa/components/ui/button";
import { Search, RefreshCw, ChevronDown, Filter } from "lucide-react";

export const MMAgentHero = () => {
  return (
    <section className="pt-32 pb-20 px-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-4 h-4 bg-mm-primary/20 rounded-full animate-pulse" />
        <div className="absolute top-40 right-20 w-6 h-6 bg-mm-accent/20 rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-40 left-1/4 w-3 h-3 bg-mm-primary/30 rounded-full animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-60 right-1/3 w-5 h-5 bg-mm-accent/15 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      <div className="container mx-auto text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white border border-mm-border rounded-full px-4 py-2 mb-8 shadow-sm">
          <span className="text-mm-text text-sm font-medium">MM Agent - Chrome Extension</span>
        </div>

        {/* Headline */}
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-mm-dark mb-6 max-w-4xl mx-auto leading-tight">
          Automate Your{" "}
          <span className="text-mm-primary">Marketplace Outreach</span>
        </h1>

        {/* Description */}
        <p className="text-mm-text text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed">
          MM Agent is a Chrome extension add-on to Marketplace Monitor. It automates further validation of your saved listings and instantly messages sellers on your behalf, so you can keep collecting items or focus on other tasks while outreach happens hands-free.
        </p>

        {/* CTA Button */}
        <Button className="bg-mm-primary hover:bg-mm-primary-dark text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg shadow-mm-primary/30 transition-all hover:shadow-xl hover:shadow-mm-primary/40 hover:-translate-y-0.5">
          Apply for Access
        </Button>

        {/* Dashboard Mockups */}
        <div className="mt-16 relative max-w-6xl mx-auto">
          {/* Main Dashboard */}
          <div className="bg-white rounded-2xl shadow-2xl border border-mm-border overflow-hidden">
            {/* Header Bar */}
            <div className="bg-mm-dark px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-mm-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">M</span>
              </div>
              <span className="text-white font-heading font-semibold">MM AGENT</span>
            </div>

            {/* Content */}
            <div className="flex">
              {/* Sidebar */}
              <div className="w-48 bg-mm-light border-r border-mm-border p-4 hidden md:block">
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-mm-border">
                  <Search size={16} className="text-mm-text" />
                  <span className="text-mm-text text-sm">Searches</span>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-6">
                <div className="mb-4">
                  <h3 className="font-heading font-semibold text-mm-dark text-lg">Results</h3>
                  <p className="text-mm-text text-sm">Here are your search results. You can view listing details, track the current stage, and directly access them on Facebook Marketplace</p>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-mm-border rounded-lg text-sm text-mm-text hover:bg-mm-light transition-colors">
                    <RefreshCw size={14} />
                    Reload
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-mm-border rounded-lg text-sm text-mm-text hover:bg-mm-light transition-colors">
                    Collapse All
                    <ChevronDown size={14} />
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-mm-border rounded-lg text-sm text-mm-text hover:bg-mm-light transition-colors">
                    <Filter size={14} />
                    Filter by...
                  </button>
                </div>

                {/* Table */}
                <div className="border border-mm-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-mm-light">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-mm-text">Title</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-mm-text hidden sm:table-cell">Price</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-mm-text">Stage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { title: "iPhone 11", price: "155 GBP", stage: "Messaged", stageColor: "text-green-600" },
                        { title: "iPhone 13", price: "295 GBP", stage: "Messaged", stageColor: "text-green-600" },
                        { title: "iPhone 14", price: "300 GBP", stage: "Messaged", stageColor: "text-green-600" },
                        { title: "iPhone 13 Pro Max, New, Unlocked", price: "450 GBP", stage: "Failed Validation", stageColor: "text-red-500" },
                      ].map((item, i) => (
                        <tr key={i} className="border-t border-mm-border hover:bg-mm-light/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <ChevronDown size={14} className="text-mm-text" />
                              <div className="w-10 h-10 bg-mm-light rounded-lg" />
                              <span className="text-mm-dark text-sm font-medium">{item.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-mm-text hidden sm:table-cell">{item.price}</td>
                          <td className={`px-4 py-3 text-sm font-medium ${item.stageColor}`}>{item.stage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Small Card */}
          <div className="absolute -left-4 bottom-20 bg-white rounded-xl shadow-xl border border-mm-border p-4 w-64 hidden lg:block animate-float">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-mm-dark rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">M</span>
              </div>
              <span className="text-mm-dark font-semibold text-sm">MM AGENT</span>
              <span className="ml-auto text-xs text-mm-text">01:56</span>
            </div>
            <p className="text-xs text-mm-text mb-2">Your MM Agent is scanning your MM results for new listings</p>
            <div className="text-xs text-mm-dark font-medium">Agent History <span className="ml-2 text-mm-text">Results 3</span></div>
            <div className="mt-2 space-y-2">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-mm-light rounded-lg">
                  <div className="w-8 h-8 bg-mm-border rounded" />
                  <div className="flex-1">
                    <div className="text-xs text-mm-dark">iPhone 11 Pro 128GB</div>
                    <div className="text-xs text-mm-text">£310</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating Chart Card */}
          <div className="absolute -right-4 top-10 bg-white rounded-xl shadow-xl border border-mm-border p-4 w-48 hidden lg:block animate-float-delayed">
            <div className="text-xs text-mm-text mb-2">Listing Performance</div>
            <div className="h-20 flex items-end gap-1">
              {[48, 65, 40, 75, 55, 17].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-mm-primary to-mm-accent rounded-t"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
