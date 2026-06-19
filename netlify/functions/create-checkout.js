// netlify/functions/create-checkout.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const PRICES = {
    classic: 15000, // $150.00 in cents
    premium: 39900, // $399.00 in cents
};

const PARTNER_FEE = 5000; // $50.00 in cents
const TAX_RATE = 0.065;   // 6.5% Florida sales tax

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
          return {
              statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

      let body;
      try {
      body = JSON.parse(event.body);
    } catch {
          return {
              statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid request body" }),
      };
    }

    const { package: pkg, guests, partner, email, hotel, date, time } = body;

    if (!PRICES[pkg]) {
          return {
              statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid package selected." }),
      };
    }

    const baseAmount    = PRICES[pkg];
      const partnerAmount = partner ? PARTNER_FEE : 0;
      const subtotal      = baseAmount + partnerAmount;
    const taxAmount     = Math.round(subtotal * TAX_RATE);

      const packageLabel = pkg === "classic" ? "Classic Day Trip" : "Premium Experience";

      const line_items = [
          {
              price_data: {
                  currency: "usd",
                  product_data: {
                      name: packageLabel,
            description: `Up to 3 guests · ${date} at ${time} · Pickup: ${hotel}`,
          },
                  unit_amount: baseAmount,
        },
              quantity: 1,
      },
    ];

    if (partner) {
          line_items.push({
                price_data: {
                    currency: "usd",
            product_data: { name: "Hitting Partner Add-on" },
                    unit_amount: PARTNER_FEE,
          },
                quantity: 1,
          });
    }

      line_items.push({
            price_data: {
                currency: "usd",
          product_data: { name: "Florida Sales Tax (6.5%)" },
                unit_amount: taxAmount,
        },
            quantity: 1,
        });

      const siteUrl = process.env.URL || "https://thetennistraveler.com";

      try {
          const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
                mode: "payment",
                customer_email: email,
                line_items,
                metadata: {
                    package: pkg,
            guests: String(guests),
                    hotel,
                    date,
                    time,
            partner: String(partner),
          },
          success_url: `${siteUrl}/?booked=1`,
          cancel_url:  `${siteUrl}/#book`,
          });

          return {
              statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: session.id, url: session.url }),
      };
      } catch (err) {
      console.error("Stripe error:", err.message);
          return {
              statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: err.message }),
      };
    }
  };
  
