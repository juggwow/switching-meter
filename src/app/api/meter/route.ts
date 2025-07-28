import { prisma } from "@/prisma/prisma-client";

export async function GET(request: Request) {
    const data = await prisma.meter.findMany();
    return Response.json(data)
}