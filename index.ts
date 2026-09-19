```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {

    try {

        if (req.method !== "POST") {

            return new Response(
                JSON.stringify({
                    error: "Method not allowed"
                }),
                {
                    status: 405,
                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );

        }


        const authHeader =
            req.headers.get(
                "Authorization"
            );


        if (!authHeader) {

            return new Response(
                JSON.stringify({
                    error: "Authentication required"
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );

        }


        /*
        Supabase client using
        the user's JWT.
        */

        const supabase =
            createClient(

                Deno.env.get(
                    "SUPABASE_URL"
                )!,

                Deno.env.get(
                    "SUPABASE_ANON_KEY"
                )!,

                {
                    global: {
                        headers: {
                            Authorization:
                                authHeader
                        }
                    }
                }

            );


        /*
        Get authenticated user.
        */

        const {
            data: {
                user
            },
            error:
                userError

        } =
        await supabase.auth
            .getUser();


        if (
            userError ||
            !user
        ) {

            return new Response(
                JSON.stringify({
                    error:
                        "Invalid authentication"
                }),
                {
                    status:401,
                    headers:{
                        "Content-Type":
                            "application/json"
                    }
                }
            );

        }


        /*
        Read request.
        */

        const body =
            await req.json();


        const labId =
            Number(body.lab_id);


        const submittedFlag =
            String(
                body.flag || ""
            ).trim();


        if (
            !labId ||
            !submittedFlag
        ) {

            return new Response(
                JSON.stringify({
                    error:
                        "lab_id and flag are required"
                }),
                {
                    status:400,
                    headers:{
                        "Content-Type":
                            "application/json"
                    }
                }
            );

        }


        /*
        Service-role client.

        The service key stays ONLY
        inside the Edge Function.
        */

        const admin =
            createClient(

                Deno.env.get(
                    "SUPABASE_URL"
                )!,

                Deno.env.get(
                    "SUPABASE_SERVICE_ROLE_KEY"
                )!

            );


        /*
        Get the lab.

        The flag is retrieved
        server-side only.
        */

        const {
            data: lab,
            error: labError

        } =
        await admin

            .from("labs")

            .select(
                "id, flag, published"
            )

            .eq(
                "id",
                labId
            )

            .eq(
                "published",
                true
            )

            .single();


        if (
            labError ||
            !lab
        ) {

            return new Response(
                JSON.stringify({
                    error:
                        "Lab not found"
                }),
                {
                    status:404,
                    headers:{
                        "Content-Type":
                            "application/json"
                    }
                }
            );

        }


        /*
        Validate flag.
        */

        const correct =
            submittedFlag ===
            lab.flag;


        /*
        Save submission.
        */

        await admin

            .from("lab_submissions")

            .insert({

                user_id:
                    user.id,

                lab_id:
                    lab.id,

                submitted_flag:
                    submittedFlag,

                correct

            });


        /*
        Return only the result.

        NEVER return the real flag.
        */

        return new Response(

            JSON.stringify({

                correct,

                message:
                    correct
                    ? "Correct flag!"
                    : "Incorrect flag."

            }),

            {

                status:200,

                headers:{
                    "Content-Type":
                        "application/json"
                }

            }

        );


    } catch (error) {

        console.error(error);


        return new Response(

            JSON.stringify({

                error:
                    "Internal server error"

            }),

            {

                status:500,

                headers:{
                    "Content-Type":
                        "application/json"
                }

            }

        );

    }

});
```
