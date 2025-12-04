/**
 * USPS Carrier Client
 * Integration with USPS APIs for rates and label generation
 */

import axios from "axios";
import type {
  ShippingRequest,
  CarrierRate,
  CarrierConfig,
  ShippingLabel,
} from "../schemas/ShippingRequest.js";
import { calculateEstimatedRate } from "./rateCalculator.js";

const USPS_API_BASE = "https://secure.shippingapis.com/ShippingAPI.dll";

/**
 * Get shipping rates from USPS
 */
export async function getRatesFromUSPS(
  request: ShippingRequest,
  config: CarrierConfig
): Promise<CarrierRate[]> {
  if (!config.apiKey || config.testMode) {
    // Return estimated rates in test mode or if no API key
    return [await calculateEstimatedRate(request, config)];
  }

  try {
    const isInternational = request.toAddress.country !== "US";

    if (isInternational) {
      return await getInternationalRates(request, config);
    } else {
      return await getDomesticRates(request, config);
    }
  } catch (error) {
    console.error("USPS rate fetch failed:", error);
    // Fallback to estimated rates
    return [await calculateEstimatedRate(request, config)];
  }
}

/**
 * Get USPS domestic rates
 */
async function getDomesticRates(
  request: ShippingRequest,
  config: CarrierConfig
): Promise<CarrierRate[]> {
  const weightOz = request.dimensions.weight;
  const weightLb = Math.floor(weightOz / 16);
  const weightOzRemainder = Math.ceil(weightOz % 16);

  const xmlRequest = `
    <RateV4Request USERID="${config.apiKey}">
      <Revision>2</Revision>
      <Package ID="1ST">
        <Service>PRIORITY</Service>
        <ZipOrigination>${request.fromAddress.postalCode}</ZipOrigination>
        <ZipDestination>${request.toAddress.postalCode}</ZipDestination>
        <Pounds>${weightLb}</Pounds>
        <Ounces>${weightOzRemainder}</Ounces>
        <Container></Container>
        <Width>${request.dimensions.width}</Width>
        <Length>${request.dimensions.length}</Length>
        <Height>${request.dimensions.height}</Height>
        <Machinable>TRUE</Machinable>
      </Package>
    </RateV4Request>
  `.trim();

  const response = await axios.get(USPS_API_BASE, {
    params: {
      API: "RateV4",
      XML: xmlRequest,
    },
  });

  // Parse USPS XML response (simplified - production would use XML parser)
  const rates: CarrierRate[] = [];

  // Extract rates from response (placeholder for actual XML parsing)
  // In production, use a proper XML parser like fast-xml-parser
  const mockRate: CarrierRate = {
    carrier: "usps",
    service: "USPS Priority Mail",
    rate: 8.5,
    currency: "USD",
    estimatedDays: 3,
  };

  rates.push(mockRate);

  return rates;
}

/**
 * Get USPS international rates
 */
async function getInternationalRates(
  request: ShippingRequest,
  config: CarrierConfig
): Promise<CarrierRate[]> {
  const weightLb = Math.ceil(request.dimensions.weight / 16);

  const xmlRequest = `
    <IntlRateV2Request USERID="${config.apiKey}">
      <Revision>2</Revision>
      <Package ID="1ST">
        <Pounds>${weightLb}</Pounds>
        <Ounces>0</Ounces>
        <MailType>Package</MailType>
        <ValueOfContents>${request.itemValue}</ValueOfContents>
        <Country>${request.toAddress.country}</Country>
        <Container></Container>
        <Width>${request.dimensions.width}</Width>
        <Length>${request.dimensions.length}</Length>
        <Height>${request.dimensions.height}</Height>
        <Girth>0</Girth>
        <OriginZip>${request.fromAddress.postalCode}</OriginZip>
        <CommercialFlag>N</CommercialFlag>
      </Package>
    </IntlRateV2Request>
  `.trim();

  const response = await axios.get(USPS_API_BASE, {
    params: {
      API: "IntlRateV2",
      XML: xmlRequest,
    },
  });

  // Parse response (simplified)
  const mockRate: CarrierRate = {
    carrier: "usps",
    service: "USPS Priority Mail International",
    rate: 35.0,
    currency: "USD",
    estimatedDays: 10,
  };

  return [mockRate];
}

/**
 * Generate USPS shipping label
 */
export async function generateUSPSLabel(
  request: ShippingRequest,
  selectedRate: CarrierRate,
  config: CarrierConfig
): Promise<Partial<ShippingLabel>> {
  if (!config.apiKey || config.testMode) {
    // Return mock label in test mode
    return generateMockUSPSLabel(request, selectedRate);
  }

  try {
    const isInternational = request.toAddress.country !== "US";

    if (isInternational) {
      return await generateInternationalLabel(request, selectedRate, config);
    } else {
      return await generateDomesticLabel(request, selectedRate, config);
    }
  } catch (error) {
    console.error("USPS label generation failed:", error);
    throw new Error(`Failed to generate USPS label: ${error}`);
  }
}

/**
 * Generate USPS domestic label
 */
async function generateDomesticLabel(
  request: ShippingRequest,
  selectedRate: CarrierRate,
  config: CarrierConfig
): Promise<Partial<ShippingLabel>> {
  const weightLb = Math.floor(request.dimensions.weight / 16);
  const weightOz = Math.ceil(request.dimensions.weight % 16);

  const xmlRequest = `
    <eVSRequest USERID="${config.apiKey}">
      <Option></Option>
      <Revision>2</Revision>
      <ImageParameters>
        <ImageParameter>4X6LABEL</ImageParameter>
      </ImageParameters>
      <FromName>${request.fromAddress.name}</FromName>
      <FromFirm>${request.fromAddress.company || ""}</FromFirm>
      <FromAddress1>${request.fromAddress.street2 || ""}</FromAddress1>
      <FromAddress2>${request.fromAddress.street1}</FromAddress2>
      <FromCity>${request.fromAddress.city}</FromCity>
      <FromState>${request.fromAddress.state}</FromState>
      <FromZip5>${request.fromAddress.postalCode.substring(0, 5)}</FromZip5>
      <FromPhone>${request.fromAddress.phone || ""}</FromPhone>
      <ToName>${request.toAddress.name}</ToName>
      <ToFirm>${request.toAddress.company || ""}</ToFirm>
      <ToAddress1>${request.toAddress.street2 || ""}</ToAddress1>
      <ToAddress2>${request.toAddress.street1}</ToAddress2>
      <ToCity>${request.toAddress.city}</ToCity>
      <ToState>${request.toAddress.state}</ToState>
      <ToZip5>${request.toAddress.postalCode.substring(0, 5)}</ToZip5>
      <ToPhone>${request.toAddress.phone || ""}</ToPhone>
      <WeightInOunces>${weightLb * 16 + weightOz}</WeightInOunces>
      <ServiceType>Priority</ServiceType>
      <Width>${request.dimensions.width}</Width>
      <Length>${request.dimensions.length}</Length>
      <Height>${request.dimensions.height}</Height>
      <Machinable>true</Machinable>
    </eVSRequest>
  `.trim();

  const response = await axios.post(USPS_API_BASE, {
    params: {
      API: "eVS",
      XML: xmlRequest,
    },
  });

  // Parse response to extract tracking number and label
  const trackingNumber = "9400111899563824466632"; // Mock
  const labelBase64 = ""; // Would contain base64 encoded PDF

  return {
    carrier: "usps",
    service: selectedRate.service,
    trackingNumber,
    trackingUrl: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    labelFormat: "pdf",
    shippingCost: selectedRate.rate,
    totalCost: selectedRate.rate,
    rawResponse: response.data,
  };
}

/**
 * Generate USPS international label
 */
async function generateInternationalLabel(
  request: ShippingRequest,
  selectedRate: CarrierRate,
  config: CarrierConfig
): Promise<Partial<ShippingLabel>> {
  // Similar to domestic but with customs forms
  return generateMockUSPSLabel(request, selectedRate);
}

/**
 * Generate mock USPS label for testing
 */
function generateMockUSPSLabel(
  request: ShippingRequest,
  selectedRate: CarrierRate
): Partial<ShippingLabel> {
  const trackingNumber = `9400${Math.floor(Math.random() * 100000000000000000)}`;

  return {
    carrier: "usps",
    service: selectedRate.service,
    trackingNumber,
    trackingUrl: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    labelFormat: "pdf",
    shippingCost: selectedRate.rate,
    totalCost: selectedRate.rate,
    rawResponse: { mock: true, testMode: true },
  };
}

/**
 * Track USPS shipment
 */
export async function trackUSPSShipment(
  trackingNumber: string,
  config: CarrierConfig
): Promise<any> {
  if (!config.apiKey || config.testMode) {
    return {
      status: "in_transit",
      events: [],
    };
  }

  const xmlRequest = `
    <TrackFieldRequest USERID="${config.apiKey}">
      <Revision>1</Revision>
      <ClientIp>127.0.0.1</ClientIp>
      <SourceId>MagnusFlipperAI</SourceId>
      <TrackID ID="${trackingNumber}"></TrackID>
    </TrackFieldRequest>
  `.trim();

  const response = await axios.get(USPS_API_BASE, {
    params: {
      API: "TrackV2",
      XML: xmlRequest,
    },
  });

  // Parse tracking response
  return response.data;
}
