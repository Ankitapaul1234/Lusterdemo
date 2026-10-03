const express = require("express");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

const router = express.Router();

/* =====================================================
   SUPABASE
===================================================== */

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
);

/* =====================================================
   RESEND
===================================================== */

const resend = new Resend(
    process.env.RESEND_API_KEY
);

/*
   IMPORTANT:
   If you have a verified domain in Resend,
   use something like:

   Lustre Nail Studio <booking@yourdomain.com>

   For testing without a verified domain, you can use
   the sender address allowed by your Resend account.
*/

const FROM_EMAIL =
    process.env.RESEND_FROM_EMAIL ||
    "Lustre Nail Studio <onboarding@resend.dev>";

/* =====================================================
   CREATE APPOINTMENT
   -----------------------------------------------------
   Compatibility route.
   Current booking.html does NOT need to use it.
===================================================== */

router.post("/create", async (req, res) => {

    try {

        const {
            customer_name,
            phone,
            email,
            service,
            appointment_date,
            appointment_time,
            special_request,
            payment_method,
            payment_status
        } = req.body;


        /* -----------------------------
           VALIDATION
        ----------------------------- */

        if (
            !customer_name ||
            !phone ||
            !service ||
            !appointment_date ||
            !appointment_time
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Required appointment details are missing."

            });

        }


        /* -----------------------------
           GENERATE SECURE VALUES
        ----------------------------- */

        const bookingId =
            "LS-" +
            Date.now().toString(36).toUpperCase() +
            "-" +
            crypto.randomBytes(3)
                .toString("hex")
                .toUpperCase();


        const ownerActionToken =
            crypto.randomBytes(32).toString("hex");


        const customerStatusToken =
            crypto.randomBytes(32).toString("hex");


        /* -----------------------------
           SAVE APPOINTMENT
        ----------------------------- */

        const { data, error } =
            await supabase
                .from("appointments")
                .insert({

                    customer_name,

                    phone,

                    email:
                        email || null,

                    service,

                    appointment_date,

                    appointment_time,

                    special_request:
                        special_request || null,

                    payment_method:
                        payment_method || "none",

                    payment_status:
                        payment_status || "not_required",

                    booking_id:
                        bookingId,

                    booking_status:
                        "pending",

                    owner_action_token:
                        ownerActionToken,

                    customer_status_token:
                        customerStatusToken

                })
                .select()
                .single();


        if (error) {

            console.error(
                "Supabase appointment error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Failed to save appointment.",

                error:
                    error.message

            });

        }


        /* -----------------------------
           SEND OWNER EMAIL
        ----------------------------- */

        const emailResult =
            await sendOwnerEmail(data);


        if (!emailResult.success) {

            console.error(
                "Owner email failed:",
                emailResult.error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Appointment was saved, but owner email could not be sent.",

                booking_id:
                    bookingId

            });

        }


        /* -----------------------------
           CUSTOMER STATUS URL
        ----------------------------- */

        const statusUrl =
            `${process.env.APP_BASE_URL}/api/appointments/status/${customerStatusToken}`;


        return res.status(201).json({

            success: true,

            message:
                "Appointment created successfully.",

            booking_id:
                bookingId,

            booking_status:
                "pending",

            status_url:
                statusUrl

        });

    }

    catch (error) {

        console.error(
            "Create appointment error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Something went wrong."

        });

    }

});


/* =====================================================
   NOTIFY OWNER FOR EXISTING APPOINTMENT

   Current booking.html creates the appointment directly
   in Supabase and then calls this route.
===================================================== */

router.post("/notify", async (req, res) => {

    try {

        const {
            appointment_id
        } = req.body;


        /* -----------------------------
           VALIDATION
        ----------------------------- */

        if (!appointment_id) {

            return res.status(400).json({

                success: false,

                message:
                    "Appointment ID is required."

            });

        }


        /* -----------------------------
           GET EXISTING APPOINTMENT
        ----------------------------- */

        const {
            data: appointment,
            error: fetchError
        } = await supabase

            .from("appointments")

            .select("*")

            .eq("id", appointment_id)

            .single();


        if (fetchError || !appointment) {

            console.error(
                "Appointment fetch error:",
                fetchError
            );

            return res.status(404).json({

                success: false,

                message:
                    "Appointment not found."

            });

        }


        /* -----------------------------
           CHECK IF ALREADY PROCESSED
        ----------------------------- */

        if (
            appointment.booking_id &&
            appointment.owner_action_token &&
            appointment.customer_status_token
        ) {

            console.log(
                "Appointment already has secure tokens:",
                appointment.booking_id
            );

            return res.json({

                success: true,

                message:
                    "Appointment notification was already prepared.",

                booking_id:
                    appointment.booking_id

            });

        }


        /* -----------------------------
           GENERATE SECURE VALUES
        ----------------------------- */

        const bookingId =
            "LS-" +
            Date.now().toString(36).toUpperCase() +
            "-" +
            crypto.randomBytes(3)
                .toString("hex")
                .toUpperCase();


        const ownerActionToken =
            crypto.randomBytes(32).toString("hex");


        const customerStatusToken =
            crypto.randomBytes(32).toString("hex");


        /* -----------------------------
           UPDATE EXISTING APPOINTMENT
        ----------------------------- */

        const {
            data: updatedAppointment,
            error: updateError
        } = await supabase

            .from("appointments")

            .update({

                booking_id:
                    bookingId,

                booking_status:
                    appointment.booking_status || "pending",

                owner_action_token:
                    ownerActionToken,

                customer_status_token:
                    customerStatusToken,

                updated_at:
                    new Date().toISOString()

            })

            .eq("id", appointment_id)

            .select()

            .single();


        if (updateError) {

            console.error(
                "Appointment update error:",
                updateError
            );

            return res.status(500).json({

                success: false,

                message:
                    "Failed to prepare appointment notification.",

                error:
                    updateError.message

            });

        }


        /* -----------------------------
           SEND OWNER EMAIL
        ----------------------------- */

        const emailResult =
            await sendOwnerEmail(
                updatedAppointment
            );


        if (!emailResult.success) {

            console.error(
                "Owner notification failed:",
                emailResult.error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Appointment was updated, but owner email could not be sent.",

                booking_id:
                    bookingId

            });

        }


        /* -----------------------------
           CUSTOMER STATUS URL
        ----------------------------- */

        const statusUrl =
            `${process.env.APP_BASE_URL}/api/appointments/status/${customerStatusToken}`;


        console.log(
            "Owner notification sent for:",
            bookingId
        );


        return res.json({

            success: true,

            message:
                "Owner notification sent successfully.",

            booking_id:
                bookingId,

            status_url:
                statusUrl

        });

    }

    catch (error) {

        console.error(
            "Notify appointment error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Something went wrong while sending notification."

        });

    }

});


/* =====================================================
   SEND OWNER EMAIL USING RESEND
===================================================== */

async function sendOwnerEmail(appointment) {

    try {

        const {
            customer_name,
            phone,
            email,
            service,
            appointment_date,
            appointment_time,
            special_request,
            payment_method,
            booking_id,
            owner_action_token
        } = appointment;


        /* -----------------------------
           ACTION URLS
        ----------------------------- */

        const acceptUrl =
            `${process.env.APP_BASE_URL}/api/appointments/action/${owner_action_token}/confirm`;


        const rejectUrl =
            `${process.env.APP_BASE_URL}/api/appointments/action/${owner_action_token}/reject`;


        /* -----------------------------
           SEND EMAIL USING RESEND
        ----------------------------- */

        const emailResponse =
            await resend.emails.send({

                from:
                    FROM_EMAIL,

                to:
                    [process.env.OWNER_EMAIL],

                subject:
                    `New Appointment Request - ${booking_id}`,

                html: `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
Lustre Nail Studio Appointment
</title>

</head>

<body style="
    margin:0;
    padding:30px;
    background:#f8f3ef;
    font-family:Arial,sans-serif;
">

<div style="
    max-width:600px;
    margin:auto;
    background:white;
    padding:30px;
    border-radius:12px;
">

<h2 style="
    color:#4a2732;
    margin-top:0;
">

Lustre Nail Studio

</h2>

<h3>
New Appointment Request
</h3>

<p>
A new customer has requested an appointment.
</p>

<hr>

<p>
<strong>Booking ID:</strong>
${booking_id}
</p>

<p>
<strong>Customer:</strong>
${customer_name}
</p>

<p>
<strong>Phone:</strong>
${phone}
</p>

<p>
<strong>Email:</strong>
${email || "Not provided"}
</p>

<p>
<strong>Service:</strong>
${service}
</p>

<p>
<strong>Date:</strong>
${appointment_date}
</p>

<p>
<strong>Time:</strong>
${appointment_time}
</p>

<p>
<strong>Payment:</strong>
${payment_method || "None"}
</p>

<p>
<strong>Special Request:</strong>
${special_request || "No additional request"}
</p>

<br>

<div style="
    text-align:center;
">

<a
    href="${acceptUrl}"
    style="
        display:inline-block;
        padding:14px 22px;
        background:#5b8c5a;
        color:white;
        text-decoration:none;
        border-radius:8px;
        font-weight:bold;
        margin:5px;
    "
>
    ACCEPT APPOINTMENT
</a>

<a
    href="${rejectUrl}"
    style="
        display:inline-block;
        padding:14px 22px;
        background:#a94442;
        color:white;
        text-decoration:none;
        border-radius:8px;
        font-weight:bold;
        margin:5px;
    "
>
    REJECT APPOINTMENT
</a>

</div>

<br>

<p style="
    font-size:13px;
    color:#777;
">

You can use the buttons above to update this appointment.

</p>

<p style="
    font-size:13px;
    color:#777;
">

Booking ID:
${booking_id}

</p>

</div>

</body>

</html>

                `

            });


        console.log(
            "Owner email response:",
            emailResponse
        );


        if (emailResponse.error) {

            console.error(
                "Resend owner email error:",
                emailResponse.error
            );

            return {

                success: false,

                error:
                    emailResponse.error.message ||
                    JSON.stringify(emailResponse.error)

            };

        }


        return {

            success: true,

            data:
                emailResponse.data

        };

    }

    catch (error) {

        console.error(
            "Resend owner email error:",
            error
        );

        return {

            success: false,

            error:
                error.message

        };

    }

}


/* =====================================================
   SEND CUSTOMER EMAIL USING RESEND

   Sent after owner clicks ACCEPT or REJECT.
===================================================== */

async function sendCustomerEmail(appointment) {

    try {

        const {

            customer_name,
            email,
            service,
            appointment_date,
            appointment_time,
            booking_id,
            booking_status,
            customer_status_token

        } = appointment;


        /* -----------------------------
           CHECK CUSTOMER EMAIL
        ----------------------------- */

        if (!email) {

            console.log(
                "No customer email provided for:",
                booking_id
            );

            return {

                success: false,

                skipped: true,

                error:
                    "Customer email was not provided."

            };

        }


        /* -----------------------------
           CUSTOMER STATUS URL
        ----------------------------- */

        const statusUrl =
            `${process.env.APP_BASE_URL}/api/appointments/status/${customer_status_token}`;


        /* -----------------------------
           MESSAGE CONTENT
        ----------------------------- */

        const isConfirmed =
            booking_status === "confirmed";


        const statusTitle =
            isConfirmed
                ? "Appointment Confirmed"
                : "Appointment Request Rejected";


        const statusColor =
            isConfirmed
                ? "#5b8c5a"
                : "#a94442";


        const mainMessage =
            isConfirmed

                ? `
                    Great news! Your appointment has been
                    confirmed by Lustre Nail Studio.
                  `

                : `
                    Unfortunately, your appointment request
                    could not be confirmed for the selected
                    date and time.
                  `;


        const nextMessage =
            isConfirmed

                ? `
                    We look forward to seeing you! 💅
                  `

                : `
                    Please choose another available slot or
                    contact Lustre Nail Studio if you need help.
                  `;


        /* -----------------------------
           SEND CUSTOMER EMAIL
        ----------------------------- */

        const emailResponse =
            await resend.emails.send({

                from:
                    FROM_EMAIL,

                to:
                    [email],

                subject:
                    `Lustre Nail Studio - ${statusTitle} - ${booking_id}`,

                html: `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width,initial-scale=1.0"
>

<title>
${statusTitle}
</title>

</head>

<body style="
    margin:0;
    padding:30px 15px;
    background:#f8f3ef;
    font-family:Arial,sans-serif;
">

<div style="
    max-width:600px;
    margin:auto;
    background:#ffffff;
    padding:35px;
    border-radius:14px;
">

<h2 style="
    color:#4a2732;
    margin-top:0;
    text-align:center;
">

Lustre Nail Studio

</h2>

<h3 style="
    color:${statusColor};
    text-align:center;
">

${statusTitle}

</h3>

<p>
Hi ${customer_name},
</p>

<p>
${mainMessage}
</p>

<hr>

<h4>
Appointment Details
</h4>

<p>
<strong>Booking ID:</strong>
${booking_id}
</p>

<p>
<strong>Service:</strong>
${service}
</p>

<p>
<strong>Date:</strong>
${appointment_date}
</p>

<p>
<strong>Time:</strong>
${appointment_time}
</p>

<p>

<strong>Status:</strong>

<span style="
    color:${statusColor};
    font-weight:bold;
">

${booking_status.toUpperCase()}

</span>

</p>

<br>

<p>
${nextMessage}
</p>

<div style="
    text-align:center;
    margin:30px 0;
">

<a
    href="${statusUrl}"
    style="
        display:inline-block;
        padding:14px 24px;
        background:${statusColor};
        color:#ffffff;
        text-decoration:none;
        border-radius:8px;
        font-weight:bold;
    "
>
    VIEW APPOINTMENT STATUS
</a>

</div>

<hr>

<p style="
    font-size:13px;
    color:#777;
    text-align:center;
">

Lustre Nail Studio<br>

24 Rose Avenue, Kolkata, West Bengal<br>

Mon–Sat: 10 AM – 7 PM<br>

Sunday: By appointment

</p>

<p style="
    font-size:13px;
    color:#777;
    text-align:center;
">

If you have any questions, please contact us.

</p>

</div>

</body>

</html>

                `

            });


        console.log(
            "Customer email response:",
            emailResponse
        );


        if (emailResponse.error) {

            console.error(
                "Resend customer email error:",
                emailResponse.error
            );

            return {

                success: false,

                error:
                    emailResponse.error.message ||
                    JSON.stringify(emailResponse.error)

            };

        }


        return {

            success: true,

            data:
                emailResponse.data

        };

    }

    catch (error) {

        console.error(
            "Resend customer email error:",
            error
        );

        return {

            success: false,

            error:
                error.message

        };

    }

}


/* =====================================================
   OWNER CONFIRM / REJECT
===================================================== */

router.get(
    "/action/:token/:action",
    async (req, res) => {

        try {

            const {
                token,
                action
            } = req.params;


            /* -----------------------------
               VALIDATE ACTION
            ----------------------------- */

            if (
                action !== "confirm" &&
                action !== "reject"
            ) {

                return res.status(400).send(`

                    <h2>
                        Invalid appointment action.
                    </h2>

                `);

            }


            /* -----------------------------
               FIND APPOINTMENT
            ----------------------------- */

            const {

                data: appointment,

                error: findError

            } = await supabase

                .from("appointments")

                .select("*")

                .eq(
                    "owner_action_token",
                    token
                )

                .single();


            if (
                findError ||
                !appointment
            ) {

                console.error(
                    "Owner action lookup error:",
                    findError
                );

                return res.status(404).send(`

                    <h2>
                        Appointment not found.
                    </h2>

                    <p>
                        This appointment link may be invalid
                        or expired.
                    </p>

                `);

            }


            /* -----------------------------
               PREVENT DUPLICATE ACTION
            ----------------------------- */

            if (
                appointment.booking_status ===
                    "confirmed" ||
                appointment.booking_status ===
                    "rejected"
            ) {

                return res.send(`

                    <!DOCTYPE html>

                    <html>

                    <body style="
                        font-family:Arial;
                        text-align:center;
                        padding:60px;
                    ">

                        <h2>
                            Appointment already processed
                        </h2>

                        <p>
                            Booking ID:
                            <strong>
                                ${appointment.booking_id}
                            </strong>
                        </p>

                        <p>
                            Current status:
                            <strong>
                                ${appointment.booking_status}
                            </strong>
                        </p>

                    </body>

                    </html>

                `);

            }


            /* -----------------------------
               DETERMINE NEW STATUS
            ----------------------------- */

            const newStatus =
                action === "confirm"
                    ? "confirmed"
                    : "rejected";


            /* -----------------------------
               UPDATE STATUS
            ----------------------------- */

            const {

                data: updatedAppointment,

                error: updateError

            } = await supabase

                .from("appointments")

                .update({

                    booking_status:
                        newStatus,

                    updated_at:
                        new Date().toISOString()

                })

                .eq(
                    "id",
                    appointment.id
                )

                .select()

                .single();


            if (updateError) {

                console.error(
                    "Owner action update error:",
                    updateError
                );

                return res.status(500).send(`

                    <h2>
                        Failed to update appointment.
                    </h2>

                    <p>
                        Please try again.
                    </p>

                `);

            }


            /* =================================================
               SEND CUSTOMER EMAIL
            ================================================= */

            const customerEmailResult =
                await sendCustomerEmail(
                    updatedAppointment
                );


            if (!customerEmailResult.success) {

                console.error(
                    "Customer email failed:",
                    customerEmailResult.error
                );

            }
            else {

                console.log(
                    `Customer ${newStatus} email sent to:`,
                    updatedAppointment.email
                );

            }


            /* -----------------------------
               OWNER RESULT PAGE
            ----------------------------- */

            const statusText =
                newStatus === "confirmed"
                    ? "CONFIRMED"
                    : "REJECTED";


            const statusColor =
                newStatus === "confirmed"
                    ? "#5b8c5a"
                    : "#a94442";


            return res.send(`

                <!DOCTYPE html>

                <html>

                <head>

                    <meta charset="UTF-8">

                    <meta
                        name="viewport"
                        content="width=device-width,initial-scale=1.0"
                    >

                    <title>
                        Appointment ${statusText}
                    </title>

                </head>

                <body style="
                    margin:0;
                    padding:60px 20px;
                    background:#f8f3ef;
                    font-family:Arial,sans-serif;
                    text-align:center;
                ">

                <div style="
                    max-width:500px;
                    margin:auto;
                    background:white;
                    padding:40px;
                    border-radius:14px;
                ">

                <h2 style="
                    color:#4a2732;
                ">

                    Lustre Nail Studio

                </h2>

                <h3 style="
                    color:${statusColor};
                ">

                    Appointment ${statusText}

                </h3>

                <p>

                    Booking ID:
                    <strong>
                        ${updatedAppointment.booking_id}
                    </strong>

                </p>

                <p>

                    Customer:
                    <strong>
                        ${updatedAppointment.customer_name}
                    </strong>

                </p>

                <p>

                    Service:
                    <strong>
                        ${updatedAppointment.service}
                    </strong>

                </p>

                <p>

                    Date:
                    <strong>
                        ${updatedAppointment.appointment_date}
                    </strong>

                </p>

                <p>

                    Time:
                    <strong>
                        ${updatedAppointment.appointment_time}
                    </strong>

                </p>

                <br>

                <p>
                    The appointment status has been updated successfully.
                </p>

                <p style="
                    font-size:14px;
                    color:#666;
                ">

                    ${
                        customerEmailResult.success
                            ? "A notification email has been sent to the customer."
                            : "The appointment was updated, but the customer email could not be sent."
                    }

                </p>

                </div>

                </body>

                </html>

            `);

        }

        catch (error) {

            console.error(
                "Owner action error:",
                error
            );

            return res.status(500).send(`

                <h2>
                    Something went wrong.
                </h2>

            `);

        }

    }
);


/* =====================================================
   CUSTOMER STATUS
===================================================== */

router.get(
    "/status/:token",
    async (req, res) => {

        try {

            const {
                token
            } = req.params;


            const {

                data: appointment,

                error

            } = await supabase

                .from("appointments")

                .select(`
                    booking_id,
                    customer_name,
                    service,
                    appointment_date,
                    appointment_time,
                    booking_status
                `)

                .eq(
                    "customer_status_token",
                    token
                )

                .single();


            if (
                error ||
                !appointment
            ) {

                return res.status(404).send(`

                    <h2>
                        Appointment not found.
                    </h2>

                `);

            }


            const status =
                appointment.booking_status ||
                "pending";


            const statusColor =
                status === "confirmed"
                    ? "#5b8c5a"
                    : status === "rejected"
                        ? "#a94442"
                        : "#b8860b";


            return res.send(`

                <!DOCTYPE html>

                <html>

                <head>

                    <meta charset="UTF-8">

                    <meta
                        name="viewport"
                        content="width=device-width,initial-scale=1.0"
                    >

                    <title>
                        Appointment Status
                    </title>

                </head>

                <body style="
                    margin:0;
                    padding:40px 20px;
                    background:#f8f3ef;
                    font-family:Arial,sans-serif;
                ">

                <div style="
                    max-width:550px;
                    margin:auto;
                    background:white;
                    padding:35px;
                    border-radius:14px;
                ">

                <h2 style="
                    color:#4a2732;
                ">

                    Lustre Nail Studio

                </h2>

                <h3>
                    Appointment Status
                </h3>

                <hr>

                <p>
                    <strong>Booking ID:</strong>
                    ${appointment.booking_id}
                </p>

                <p>
                    <strong>Customer:</strong>
                    ${appointment.customer_name}
                </p>

                <p>
                    <strong>Service:</strong>
                    ${appointment.service}
                </p>

                <p>
                    <strong>Date:</strong>
                    ${appointment.appointment_date}
                </p>

                <p>
                    <strong>Time:</strong>
                    ${appointment.appointment_time}
                </p>

                <p>

                    <strong>Status:</strong>

                    <span style="
                        color:${statusColor};
                        font-weight:bold;
                    ">

                        ${status.toUpperCase()}

                    </span>

                </p>

                </div>

                </body>

                </html>

            `);

        }

        catch (error) {

            console.error(
                "Customer status error:",
                error
            );

            return res.status(500).send(`

                <h2>
                    Something went wrong.
                </h2>

            `);

        }

    }
);


/* =====================================================
   TEST OWNER EMAIL USING RESEND
===================================================== */

router.get(
    "/test-email",
    async (req, res) => {

        try {

            const emailResponse =
                await resend.emails.send({

                    from:
                        FROM_EMAIL,

                    to:
                        [process.env.OWNER_EMAIL],

                    subject:
                        "Lustre Nail Studio - Test Email",

                    html: `

                        <div style="
                            font-family:Arial,sans-serif;
                            padding:30px;
                        ">

                            <h2 style="
                                color:#4a2732;
                            ">

                                Lustre Nail Studio

                            </h2>

                            <p>

                                This is a test email from your
                                Lustre Nail Studio backend.

                            </p>

                            <p>

                                Resend email API is working correctly.

                            </p>

                        </div>

                    `

                });


            console.log(
                "Test email response:",
                emailResponse
            );


            if (emailResponse.error) {

                return res.status(500).json({

                    success: false,

                    message:
                        "Resend failed to send test email.",

                    error:
                        emailResponse.error.message ||
                        JSON.stringify(emailResponse.error)

                });

            }


            return res.json({

                success: true,

                message:
                    "Test email sent successfully.",

                message_id:
                    emailResponse.data?.id || null

            });

        }

        catch (error) {

            console.error(
                "Test email error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Failed to send test email.",

                error:
                    error.message

            });

        }

    }
);


/* =====================================================
   EXPORT
===================================================== */

module.exports = router;