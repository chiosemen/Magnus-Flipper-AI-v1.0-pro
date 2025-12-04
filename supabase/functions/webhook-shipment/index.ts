/**
 * Supabase Edge Function: Shipment Webhook Handler
 * Handles tracking updates from carrier webhooks (USPS, UPS, FedEx, DHL)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  try {
    const carrier = req.headers.get("x-carrier") || "unknown";
    const body = await req.json();

    console.log(`Received webhook from ${carrier}:`, body);

    // Verify webhook signature based on carrier
    const isValid = await verifyWebhookSignature(req, carrier, body);
    if (!isValid) {
      return new Response("Invalid webhook signature", { status: 401 });
    }

    // Process webhook based on carrier
    let trackingEvent;
    switch (carrier.toLowerCase()) {
      case "usps":
        trackingEvent = await processUSPSWebhook(body);
        break;
      case "ups":
        trackingEvent = await processUPSWebhook(body);
        break;
      case "fedex":
        trackingEvent = await processFedExWebhook(body);
        break;
      case "dhl":
        trackingEvent = await processDHLWebhook(body);
        break;
      default:
        trackingEvent = await processGenericWebhook(body);
    }

    if (trackingEvent) {
      // Store tracking event in database
      const { error } = await supabase
        .from("tracking_events")
        .insert(trackingEvent);

      if (error) {
        console.error("Error storing tracking event:", error);
        return new Response("Error storing event", { status: 500 });
      }

      // Update shipping label status if needed
      if (
        trackingEvent.status === "delivered" ||
        trackingEvent.status === "exception"
      ) {
        await updateShippingLabelStatus(
          trackingEvent.tracking_number,
          trackingEvent.status
        );
      }

      // Send notification to user if significant event
      if (shouldNotifyUser(trackingEvent.status)) {
        await sendUserNotification(trackingEvent);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return new Response(`Webhook Error: ${error.message}`, { status: 500 });
  }
});

async function verifyWebhookSignature(
  req: Request,
  carrier: string,
  body: any
): Promise<boolean> {
  const signature = req.headers.get("x-signature") || "";
  const secret = Deno.env.get(`${carrier.toUpperCase()}_WEBHOOK_SECRET`);

  if (!secret) {
    console.warn(`No webhook secret configured for ${carrier}`);
    return true; // Allow in development
  }

  // Implement carrier-specific signature verification
  // This is a simplified example
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(body) + secret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedSignature = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signature === computedSignature;
}

async function processUSPSWebhook(body: any): Promise<any> {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tracking_number: body.tracking_number || body.TrackingNumber,
    carrier: "usps",
    status: normalizeStatus(body.event_type || body.EventType),
    status_detail: body.description || body.EventDescription,
    location: body.location
      ? `${body.location.city}, ${body.location.state}`
      : null,
    timestamp: body.timestamp || new Date().toISOString(),
    estimated_delivery: body.expected_delivery_date || null,
    metadata: body,
    created_at: new Date().toISOString(),
  };
}

async function processUPSWebhook(body: any): Promise<any> {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tracking_number: body.trackingNumber,
    carrier: "ups",
    status: normalizeStatus(body.status?.type),
    status_detail: body.status?.description,
    location: body.activity?.location?.address?.city
      ? `${body.activity.location.address.city}, ${body.activity.location.address.stateProvince}`
      : null,
    timestamp: body.activity?.date || new Date().toISOString(),
    estimated_delivery: body.deliveryDate?.date || null,
    metadata: body,
    created_at: new Date().toISOString(),
  };
}

async function processFedExWebhook(body: any): Promise<any> {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tracking_number: body.trackingNumber,
    carrier: "fedex",
    status: normalizeStatus(body.latestStatus?.statusCode),
    status_detail: body.latestStatus?.description,
    location: body.latestStatus?.scanLocation?.city
      ? `${body.latestStatus.scanLocation.city}, ${body.latestStatus.scanLocation.stateOrProvinceCode}`
      : null,
    timestamp: body.latestStatus?.date || new Date().toISOString(),
    estimated_delivery: body.estimatedDeliveryTimeWindow?.window?.ends || null,
    metadata: body,
    created_at: new Date().toISOString(),
  };
}

async function processDHLWebhook(body: any): Promise<any> {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tracking_number: body.id,
    carrier: "dhl",
    status: normalizeStatus(body.status?.status),
    status_detail: body.status?.description,
    location: body.status?.location?.address?.addressLocality
      ? `${body.status.location.address.addressLocality}`
      : null,
    timestamp: body.status?.timestamp || new Date().toISOString(),
    estimated_delivery: body.estimatedDeliveryDate || null,
    metadata: body,
    created_at: new Date().toISOString(),
  };
}

async function processGenericWebhook(body: any): Promise<any> {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tracking_number: body.tracking_number || body.trackingNumber,
    carrier: body.carrier || "unknown",
    status: normalizeStatus(body.status),
    status_detail: body.description || body.message,
    location: body.location || null,
    timestamp: body.timestamp || new Date().toISOString(),
    estimated_delivery: body.estimated_delivery || null,
    metadata: body,
    created_at: new Date().toISOString(),
  };
}

function normalizeStatus(status: string): string {
  if (!status) return "unknown";

  const statusLower = status.toLowerCase();

  // Map various carrier statuses to our standard statuses
  if (statusLower.includes("deliver")) return "delivered";
  if (statusLower.includes("transit") || statusLower.includes("in_transit"))
    return "in_transit";
  if (statusLower.includes("out_for_delivery")) return "out_for_delivery";
  if (statusLower.includes("picked") || statusLower.includes("accept"))
    return "picked_up";
  if (statusLower.includes("label") || statusLower.includes("create"))
    return "label_created";
  if (statusLower.includes("exception") || statusLower.includes("delay"))
    return "exception";
  if (statusLower.includes("return")) return "returned";

  return statusLower;
}

async function updateShippingLabelStatus(
  trackingNumber: string,
  status: string
): Promise<void> {
  const { error } = await supabase
    .from("shipping_labels")
    .update({ status })
    .eq("tracking_number", trackingNumber);

  if (error) {
    console.error("Error updating shipping label:", error);
  }
}

function shouldNotifyUser(status: string): boolean {
  const notifyStatuses = [
    "delivered",
    "out_for_delivery",
    "exception",
    "returned",
  ];
  return notifyStatuses.includes(status);
}

async function sendUserNotification(trackingEvent: any): Promise<void> {
  // Get label and user info
  const { data: label } = await supabase
    .from("shipping_labels")
    .select("order_id")
    .eq("tracking_number", trackingEvent.tracking_number)
    .single();

  if (!label) return;

  // Create notification record
  await supabase.from("notifications").insert({
    user_id: label.user_id,
    type: "shipment_update",
    title: `Shipment ${trackingEvent.status}`,
    message: `Your package (${trackingEvent.tracking_number}) is ${trackingEvent.status}`,
    metadata: {
      tracking_number: trackingEvent.tracking_number,
      status: trackingEvent.status,
      location: trackingEvent.location,
    },
    created_at: new Date().toISOString(),
  });

  // TODO: Send email/push notification via external service
}
