import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CourseGroupOverrides, DEFAULT_COURSE_OVERRIDES } from "@/lib/race-normalize";

const CONFIG_KEY = "courseGroupOverrides";

async function load(): Promise<CourseGroupOverrides> {
  const row = await prisma.appConfig.findUnique({ where: { key: CONFIG_KEY } });
  if (!row) return { ...DEFAULT_COURSE_OVERRIDES };
  return { ...DEFAULT_COURSE_OVERRIDES, ...(row.value as unknown as Partial<CourseGroupOverrides>) };
}

export async function GET() {
  return NextResponse.json(await load());
}

/** PUT: replace the full overrides object */
export async function PUT(req: NextRequest) {
  const body = (await req.json()) as CourseGroupOverrides;
  const data: CourseGroupOverrides = {
    displayNames: body.displayNames ?? {},
    forceSeparate: body.forceSeparate ?? [],
    forceMerge: body.forceMerge ?? [],
  };
  await prisma.appConfig.upsert({
    where:  { key: CONFIG_KEY },
    update: { value: data as never },
    create: { key: CONFIG_KEY, value: data as never },
  });
  return NextResponse.json(data);
}
