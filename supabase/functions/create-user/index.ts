import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password, full_name, department, staff_id } = await req.json();

    // Validate input
    if (!email || !password || !full_name || !staff_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Create user in auth.users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name,
        staff_id: staff_id,
        department: department || "General",
      },
    });

    if (userError) {
      console.error("User creation error:", userError);
      return new Response(
        JSON.stringify({ error: userError.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Update profile with staff_id and department
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        staff_id: staff_id,
        full_name: full_name,
        department: department || "General",
      })
      .eq("id", userData.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userData.user.id,
        email: userData.user.email,
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
