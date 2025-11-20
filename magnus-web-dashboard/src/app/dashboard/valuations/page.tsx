'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input, TextArea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Sparkles, DollarSign, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ValuationsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    brand: '',
    condition: 'good',
  });
  const [valuation, setValuation] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/extensions/ai-valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productData: formData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Valuation failed');
      }

      setValuation(data.valuation);
      toast.success('Valuation generated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate valuation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Valuations</h1>
          <p className="text-gray-600 mt-1">
            Get instant AI-powered valuations for your products
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Valuation Form */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
                Request Valuation
              </h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Product Title"
                  placeholder="e.g., Vintage Nintendo Game Boy"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />

                <TextArea
                  label="Description"
                  placeholder="Describe the condition, features, and any notable details..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Category"
                    placeholder="e.g., Electronics"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  />

                  <Input
                    label="Brand"
                    placeholder="e.g., Nintendo"
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.condition}
                    onChange={(e) =>
                      setFormData({ ...formData, condition: e.target.value })
                    }
                  >
                    <option value="new">New</option>
                    <option value="like_new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>

                <Button type="submit" className="w-full" isLoading={isLoading}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Valuation
                </Button>
              </form>
            </CardBody>
          </Card>

          {/* Valuation Result */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Valuation Result</h2>
            </CardHeader>
            <CardBody>
              {!valuation ? (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Fill out the form to get an AI-powered valuation
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Estimated Value */}
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">
                      Estimated Value
                    </p>
                    <p className="text-4xl font-bold text-blue-600 mt-2">
                      ${valuation.estimated_value.toFixed(2)}
                    </p>
                    <div className="flex items-center justify-center mt-2 text-sm text-gray-600">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {(valuation.confidence_score * 100).toFixed(0)}%
                      confidence
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Price Range
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Low</p>
                        <p className="text-lg font-semibold text-gray-900">
                          ${valuation.price_range.min.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex-1 mx-4 h-2 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-full" />
                      <div className="text-center">
                        <p className="text-xs text-gray-500">High</p>
                        <p className="text-lg font-semibold text-gray-900">
                          ${valuation.price_range.max.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Comparable Items */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Comparable Sales
                    </p>
                    <div className="space-y-2">
                      {valuation.comparable_items.map(
                        (item: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {item.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.condition} • {item.marketplace}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                              ${item.price.toFixed(2)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
