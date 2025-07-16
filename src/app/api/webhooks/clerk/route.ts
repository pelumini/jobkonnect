import { inngest } from "@/services/inngest/client";
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

export async function POST(req: Request, res: Response) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  //   // Get the ID and type
  //   const { id } = evt.data;
  //   const eventType = evt.type;

  //   try {
  //     // CREATE
  //     if (eventType === "user.created") {
  //       const { id, email_addresses, image_url, username } = evt.data;
  //       const user = {
  //         clerkId: id,
  //         email: email_addresses[0].email_address,
  //         username: username || null,
  //         image_url: image_url,
  //       };

  //       const newUser = await createUser(user);

  //       // Set public metadata
  //       if (newUser) {
  //         await clerkClient.users.updateUser(id, {
  //           publicMetadata: {
  //             userId: newUser.id,
  //           },
  //         });
  //       } else {
  //         await clerkClient.users.deleteUser(id);
  //         return NextResponse.redirect("/");
  //       }

  //       return NextResponse.json({ message: "OK", user: newUser });
  //     }

  //     // UPDATE
  //     if (eventType === "user.updated") {
  //       const { id, image_url, username } = evt.data;

  //       const user = {
  //         username: username || null,
  //         image_url: image_url,
  //       };

  //       const updatedUser = await updateUser(id, user);

  //       return NextResponse.json({ message: "OK", user: updatedUser });
  //     }

  //     // DELETE
  //     if (eventType === "user.deleted") {
  //       const { id } = evt.data;

  //       const deletedUser = await deleteUser(id!);

  //       return NextResponse.json({ message: "OK", user: deletedUser });
  //     }
  //   } catch (error) {
  //     console.error(`Error handling ${eventType} event:`, error);
  //     return new Response(`Error handling ${eventType} event`, { status: 500 });
  //   }

  if (
    typeof evt === "object" &&
    evt !== null &&
    "type" in evt &&
    evt.type === "user.created" &&
    "data" in evt &&
    "raw" in evt &&
    "headers" in evt
  ) {
    console.log("calling our route api");

    await inngest.send({
      name: "clerk/user.created",
      data: {
        data: (evt as any).data,
        raw: (evt as any).raw,
        headers: (evt as any).headers,
      },
    });
  } else {
    // Optionally handle other event types or ignore
    return new Response("Unsupported event type or malformed payload", {
      status: 400,
    });
  }

  await inngest.send({
    name: "clerk/user.created",
    data: {
      data: (evt as any).data,
      raw: (evt as any).raw,
      headers: (evt as any).headers,
    },
  });

  return NextResponse.json({ received: true }, { status: 200 });
}
