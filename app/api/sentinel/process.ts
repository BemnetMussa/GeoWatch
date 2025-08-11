import type { NextApiRequest, NextApiResponse } from "next";

const SENTINEL_HUB_TOKEN = process.env.SENTINEL_HUB_ACCESS_TOKEN;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { bbox, dateFrom1, dateTo1, dateFrom2, dateTo2 } = req.body;

  const evalscript = `
    function setup() {
      return {
        input: [
          { bands: ["B4", "B8"] },
          { bands: ["B4", "B8"] }
        ],
        output: { bands: 1, sampleType: "FLOAT32" }
      };
    }

    function evaluatePixel(samples) {
      function ndvi(b4, b8) {
        return (b8 - b4) / (b8 + b4);
      }
      const ndvi1 = ndvi(samples[0].B4, samples[0].B8);
      const ndvi2 = ndvi(samples[1].B4, samples[1].B8);
      return [ndvi2 - ndvi1];
    }
  `;

  try {
    const response = await fetch("https://services.sentinel-hub.com/api/v1/process", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENTINEL_HUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          bounds: { bbox },
          data: [
            {
              type: "S2L2A",
              dataFilter: { timeRange: { from: dateFrom1, to: dateTo1 } },
            },
            {
              type: "S2L2A",
              dataFilter: { timeRange: { from: dateFrom2, to: dateTo2 } },
            },
          ],
        },
        output: {
          width: 512,
          height: 512,
          responses: [{ identifier: "default", format: { type: "image/tiff" } }],
        },
        evalscript,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(500).json({ error });
    }

    const buffer = await response.arrayBuffer();

    // Return image buffer as base64 or send as blob
    const base64 = Buffer.from(buffer).toString("base64");
    res.status(200).json({ imageBase64: base64 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
