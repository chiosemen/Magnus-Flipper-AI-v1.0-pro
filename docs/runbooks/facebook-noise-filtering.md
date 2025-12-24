# Facebook Noise Filtering

## Overview

Facebook Marketplace scraping can capture UI elements, advertisements, and other noise instead of actual listings. This runbook covers filtering strategies.

## Common Noise Patterns

### UI Elements
- Navigation buttons
- Filter controls
- Category headers
- Footer content
- Sidebar widgets

### Advertisements
- Sponsored listings
- Promoted posts
- Marketplace ads
- External links

### Invalid Listings
- Deleted listings (still in DOM)
- Private listings
- Group posts (not marketplace)
- Events (not listings)

## Detection

Signs of noise in scraped data:
- Items with no price
- Items with no image
- Items with generic titles ("See more", "View all")
- Items with external URLs (not facebook.com/marketplace)
- Duplicate items

## Filtering Strategies

### 1. URL Validation
- Must contain `/marketplace/item/`
- Must be from `facebook.com` domain
- Must not be external redirects

### 2. Price Validation
- Must have numeric price
- Must be within reasonable range (e.g., $1 - $1,000,000)
- Must not be "Free" unless explicitly allowed

### 3. Image Validation
- Must have image URL
- Must not be placeholder images
- Must not be UI element images

### 4. Title Validation
- Must not be generic UI text
- Must have minimum length (e.g., 10 characters)
- Must not be navigation labels

### 5. Metadata Validation
- Must have location data (if required)
- Must have seller information (if available)
- Must have listing date

## Normalization

After filtering, normalize:
- Price format (remove currency symbols, convert to number)
- Image URLs (use CDN URLs if available)
- Location format (standardize city/state/country)
- Date format (ISO 8601)

## Monitoring

Track noise metrics:
- Noise rate (noise items / total items)
- Filter effectiveness
- False positive rate (valid items filtered)
- False negative rate (noise items not filtered)

## Troubleshooting

### High Noise Rate
- Review selectors (may be too broad)
- Check for DOM structure changes
- Verify filter rules are active
- Test selectors in browser console

### Low Item Count
- Filters may be too strict
- Review false positive rate
- Adjust validation thresholds
- Test with sample data

## Best Practices

1. **Start strict, relax gradually** - Better to filter too much than too little
2. **Monitor noise trends** - Track over time to detect changes
3. **Test filters regularly** - Validate against known good/bad items
4. **Document filter rules** - Keep runbook updated with current rules
5. **Review false positives** - Adjust filters based on valid items filtered

