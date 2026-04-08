import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EXTRACTION_PROMPT = `You are an information extraction system.

Your task is to extract structured slot game design data from the provided document.

DO NOT summarize.
DO NOT explain.
DO NOT add commentary.
ONLY return structured JSON.

Extract the following fields:

game_name
target_market (array)
grid_size (e.g. "5x3")
pay_mechanic (paylines / payways / cluster)
volatility (low / medium / medium-high / high)
rtp (number or null)
features (array of feature names)
jackpot_types (array: mini, minor, major, grand)
has_progression (true/false)
has_persistent_feature (true/false)
has_collect_mechanic (true/false)
feature_descriptions (short structured summary)
usp (unique selling points summary)

Rules:
If not found → return null
Do not hallucinate
Keep values short and clean
Normalize wording where possible
Return ONLY valid JSON.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentText } = await req.json();

    if (!documentText || typeof documentText !== "string") {
      return new Response(
        JSON.stringify({ error: "documentText is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: EXTRACTION_PROMPT },
          { role: "user", content: documentText },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_game_data",
              description: "Extract structured slot game design data from a document",
              parameters: {
                type: "object",
                properties: {
                  game_name: { type: "string", description: "Name of the game" },
                  target_market: { type: "array", items: { type: "string" }, description: "Target markets" },
                  grid_size: { type: "string", description: "Grid layout e.g. 5x3" },
                  pay_mechanic: { type: "string", enum: ["paylines", "payways", "cluster"], description: "Pay mechanic type" },
                  volatility: { type: "string", enum: ["low", "medium", "medium-high", "high"] },
                  rtp: { type: "number", description: "RTP percentage or null" },
                  features: { type: "array", items: { type: "string" }, description: "Feature names" },
                  jackpot_types: { type: "array", items: { type: "string" }, description: "Jackpot types" },
                  has_progression: { type: "boolean" },
                  has_persistent_feature: { type: "boolean" },
                  has_collect_mechanic: { type: "boolean" },
                  feature_descriptions: { type: "string", description: "Short structured summary of features" },
                  usp: { type: "string", description: "Unique selling points summary" },
                },
                required: ["game_name"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_game_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI extraction failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      // Fallback: try to parse content as JSON
      const content = data.choices?.[0]?.message?.content || "";
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extracted = JSON.parse(jsonMatch[0]);
          return new Response(JSON.stringify({ extracted }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch {}
      return new Response(
        JSON.stringify({ error: "Could not extract structured data. Please fill manually." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-game-brief error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
