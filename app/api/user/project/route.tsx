import { db } from "@/config/db";
import { ProjectTable, ScreenConfigTable, usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
      try {
         const { userInput, device, projectId } = await req.json();
         const user = await currentUser();

         if(!user){
            return NextResponse.json({error:"Unauthorized"}, {status:401});
         }

         const email = user?.primaryEmailAddress?.emailAddress;
        if (!email) {
            return NextResponse.json({ error: "User email not found" }, { status: 400 });
        }

        const existingUser = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.email, email));

        if (existingUser.length === 0) {
          await db.insert(usersTable).values({
            name: user.fullName ?? "",
            email,
          });
        }

         const result= await db.insert(ProjectTable).values({
            projectId: projectId,
            userId: email,
            device: device,
            userInput:userInput
         }).returning();

         return NextResponse.json(result[0]);

      } catch (error) {
        console.error("Failed to create project:", error);
        return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }
}

export async function GET(req:NextRequest) {
   const projectId=await req.nextUrl.searchParams.get('projectId');
   const user= await currentUser()
   
   try {
   const result=await db.select().from(ProjectTable)
   .where(and(eq(ProjectTable.projectId,projectId as string),eq(ProjectTable.userId,user?.primaryEmailAddress?.emailAddress as string)));

   const ScreenConfig=await db.select().from(ScreenConfigTable)
   .where(eq(ScreenConfigTable.projectId,projectId as string));

   return NextResponse.json({
    projectDetail: result[0],
    screenConfig: ScreenConfig
   });
}
catch (e) {
   return NextResponse.json({ msg: 'Error'})
 }
}

           //.....POST.....//
/*export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { userInput, device, projectId } = await req.json();

    const email = user.primaryEmailAddress?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(ProjectTable)
      .values({
        projectId: projectId,
        userId: email,
        device: device,
        userInput: userInput,
      })
      .returning();

    return NextResponse.json(result[0]);

  } catch (error) {
    console.error("Failed to create project:", error);

    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
} *\

         // ....GET....//
/*export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const email = user.primaryEmailAddress?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    const projectId = req.nextUrl.searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const result = await db
      .select()
      .from(ProjectTable)
      .where(
        and(
          eq(ProjectTable.projectId, projectId),
          eq(ProjectTable.userId, email)
        )
      );

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);

  } catch (error) {
    console.error("Failed to fetch project:", error);

    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
} */