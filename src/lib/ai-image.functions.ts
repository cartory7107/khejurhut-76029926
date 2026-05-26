import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Generate a luxury product image via Lovable AI Gateway and return a data URL.
 * Admin-gated: requires products.manage permission via RLS-friendly server fn.
 */
export const generateProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      prompt: z.string().min(2).max(400),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // Verify admin can manage products
    const { data: allowed } = await context.supabase.rpc("has_permission", {
      _user_id: context.userId,
      _permission: "products.manage",
    });
    if (!allowed) throw new Error("Forbidden");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY not configured");

    const fullPrompt = `Ultra premium luxury studio product photograph: ${data.prompt}. Cinematic lighting, dark warm background, golden rim light, shallow depth of field, high resolution editorial e-commerce photography, no text, no watermark, centered composition.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (res.status === 429) throw new Error("Rate limited — try again shortly");
    if (res.status === 402) throw new Error("AI credits exhausted — please add funds");
    if (!res.ok) throw new Error(`Image generation failed (${res.status})`);

    const json = await res.json();
    // Locate base64 image part across possible response shapes
    const choice = json?.choices?.[0]?.message;
    const parts: any[] = Array.isArray(choice?.content) ? choice.content : [];
    let url: string | undefined;
    for (const p of parts) {
      if (p?.type === "image_url" && typeof p?.image_url?.url === "string") { url = p.image_url.url; break; }
      if (p?.type === "image" && typeof p?.image_url === "string") { url = p.image_url; break; }
    }
    // Some implementations expose images[] on the message
    if (!url && Array.isArray(choice?.images)) {
      const first = choice.images[0];
      url = typeof first === "string" ? first : first?.image_url?.url || first?.url;
    }
    if (!url) throw new Error("No image returned from AI gateway");
    return { url };
  });