import { NextResponse } from "next/server";
import { generate } from "@/lib/vave/engine";
import type { VaveInput } from "@/lib/vave/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: VaveInput;
  try {
    body = (await req.json()) as VaveInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const required: (keyof VaveInput)[] = [
    "current_grade_id",
    "current_thk_mm",
    "part_family",
    "annual_volume",
    "blank_area_m2",
    "current_coating_id",
    "current_joining_ids",
  ];
  for (const k of required) {
    if (body[k] === undefined || body[k] === null) {
      return NextResponse.json({ error: `Missing field: ${k}` }, { status: 400 });
    }
  }

  try {
    const out = await generate(body);
    return NextResponse.json(out);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Engine failure" },
      { status: 500 },
    );
  }
}
