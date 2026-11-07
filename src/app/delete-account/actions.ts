"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requestAccountDeletion(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmed = String(formData.get("confirm") ?? "") === "true";

  if (!email || !password || !confirmed) {
    redirect("/delete-account?error=invalid");
  }

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> | null =
    null;
  let authenticated = false;
  let completed = false;
  let errorCode: "not_verified" | "processing_failed" | "unavailable" =
    "unavailable";

  try {
    supabase = await createSupabaseServerClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      errorCode = "not_verified";
    } else {
      authenticated = true;
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        errorCode = "not_verified";
      } else {
        const request = await supabase.rpc("request_account_deletion");
        if (
          request.error ||
          !["pending", "completed"].includes(request.data ?? "")
        ) {
          errorCode = "processing_failed";
        } else if (request.data === "completed") {
          completed = true;
        } else {
          const finalized = await supabase.rpc("finalize_account_deletion");
          completed = !finalized.error && finalized.data === "completed";
          if (!completed) errorCode = "processing_failed";
        }
      }
    }
  } catch (error) {
    console.error(
      "Admin-hosted account deletion request failed.",
      error instanceof Error ? error.message : "Unknown server error.",
    );
    errorCode = "unavailable";
  }

  if (authenticated && supabase) {
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
        console.error(
          "Could not clear the local session after account deletion.",
          error.code,
        );
      }
    } catch (error) {
      console.error(
        "Could not clear the local session after account deletion.",
        error instanceof Error ? error.message : "Unknown server error.",
      );
    }
  }

  redirect(
    completed
      ? "/delete-account?status=requested"
      : `/delete-account?error=${errorCode}`,
  );
}
