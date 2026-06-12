import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const inseeCode = request.nextUrl.searchParams.get("inseeCode")?.trim();
  if (!inseeCode) {
    return NextResponse.json(
      { error: "Code INSEE requis (?inseeCode=)" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("communes")
    .select(
      "id, insee_code, name, postcode, department, access_status, centroid_lat, centroid_lng",
    )
    .eq("insee_code", inseeCode)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ commune: data });
}
