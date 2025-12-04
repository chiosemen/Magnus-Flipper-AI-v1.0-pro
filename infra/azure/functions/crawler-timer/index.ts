import { AzureFunction, Context } from "@azure/functions";
import { createClient } from "@supabase/supabase-js";

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  context.log("Crawler timer trigger executed at:", new Date().toISOString());

  try {
    const { data: marketplaces, error } = await supabase
      .from("marketplace_settings")
      .select("*")
      .eq("enabled", true);

    if (error) {
      throw error;
    }

    context.log(`Found ${marketplaces?.length || 0} enabled marketplaces`);

    for (const marketplace of marketplaces || []) {
      const { error: jobError } = await supabase.from("job_queue").insert({
        job_type: "scan_marketplace",
        status: "pending",
        marketplace: marketplace.marketplace,
      });

      if (jobError) {
        context.log.error("Error creating job:", jobError);
      } else {
        context.log(`Created scan job for ${marketplace.marketplace}`);
      }
    }

    context.log("Crawler timer completed successfully");
  } catch (error) {
    context.log.error("Crawler timer error:", error);
    throw error;
  }
};

export default timerTrigger;
