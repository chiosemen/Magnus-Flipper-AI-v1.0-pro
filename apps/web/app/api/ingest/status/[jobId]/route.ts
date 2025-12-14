export async function GET(
  req: Request,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;
  
  // Extract timestamp from jobId (format: fake-job-${timestamp})
  const timestamp = Number(jobId.split("-").pop() || Date.now().toString());
  const age = Date.now() - timestamp;

  // Return "running" if job is less than 5 seconds old
  if (age < 5_000) {
    return Response.json({ status: "running" });
  }

  // Return "completed" with fake results after 5 seconds
  return Response.json({
    status: "completed",
    results: [
      {
        items: [
          {
            id: "listing-1",
            title: "iPhone 16 Pro – Like New",
            price: 799,
            currency: "GBP",
            marketplace: "facebook",
            location: "United Kingdom",
            url: "https://facebook.com/marketplace/item/listing-1",
            images: ["https://via.placeholder.com/400x300?text=iPhone+16+Pro"],
            sellerName: "John Doe",
            postedAt: new Date().toISOString(),
          },
          {
            id: "listing-2",
            title: "iPhone 16 – Excellent Condition",
            price: 699,
            currency: "GBP",
            marketplace: "facebook",
            location: "United Kingdom",
            url: "https://facebook.com/marketplace/item/listing-2",
            images: ["https://via.placeholder.com/400x300?text=iPhone+16"],
            sellerName: "Jane Smith",
            postedAt: new Date().toISOString(),
          },
          {
            id: "listing-3",
            title: "iPhone 16 Pro Max – Unboxed",
            price: 899,
            currency: "GBP",
            marketplace: "facebook",
            location: "United Kingdom",
            url: "https://facebook.com/marketplace/item/listing-3",
            images: ["https://via.placeholder.com/400x300?text=iPhone+16+Pro+Max"],
            sellerName: "Tech Deals UK",
            postedAt: new Date().toISOString(),
          },
        ],
        listingsFound: 3,
      },
    ],
  });
}
