export const CATEGORIES = [
  { id: 'phones', label: 'Phones', icon: 'smartphone' },
  { id: 'laptops', label: 'Laptops', icon: 'laptop' },
  { id: 'cars', label: 'Cars', icon: 'car' },
  { id: 'couches', label: 'Couches', icon: 'sofa' },
]

export function getManufacturersForCategory(category: string) {
  const map: Record<string, Array<{ id: string; label: string }>> = {
    phones: [
      { id: 'apple', label: 'Apple' },
      { id: 'samsung', label: 'Samsung' },
      { id: 'google', label: 'Google' },
    ],
    laptops: [
      { id: 'apple', label: 'Apple' },
      { id: 'dell', label: 'Dell' },
      { id: 'lenovo', label: 'Lenovo' },
    ],
    cars: [
      { id: 'toyota', label: 'Toyota' },
      { id: 'honda', label: 'Honda' },
      { id: 'ford', label: 'Ford' },
    ],
  }
  return map[category] ?? []
}

export function getModelsForManufacturer(manufacturer: string) {
  const map: Record<string, Array<{ series: string; models: string[] }>> = {
    apple: [{ series: 'iPhone', models: ['15 Pro', '14 Pro', '13 Mini'] }],
    samsung: [{ series: 'Galaxy S', models: ['S24', 'S23', 'S22'] }],
    google: [{ series: 'Pixel', models: ['8 Pro', '8a', '7 Pro'] }],
    dell: [{ series: 'XPS', models: ['XPS 15', 'XPS 13'] }],
    lenovo: [{ series: 'ThinkPad', models: ['X1 Carbon', 'T14'] }],
    toyota: [{ series: 'Corolla', models: ['XSE', 'SE'] }],
  }
  return map[manufacturer] ?? []
}
