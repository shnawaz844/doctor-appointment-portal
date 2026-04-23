import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthSession } from "@/lib/auth";

// Helper to add 15 minutes to 'HH:mm AM/PM' string
function add15Minutes(timeStr: string): string {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes + 15);

    let newHours = date.getHours();
    const newMins = date.getMinutes();
    const newPeriod = newHours >= 12 ? 'PM' : 'AM';
    newHours = newHours % 12 || 12;

    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')} ${newPeriod}`;
}

// Helper to convert 'HH:mm AM/PM' to minutes for easy comparison
function timeToMinutes(timeStr: string): number {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
}

// Function to send Expo Push Notification
async function sendPushNotification(expoPushToken: string, title: string, body: string) {
    if (!expoPushToken) return;
    try {
        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: expoPushToken,
                sound: 'default',
                title: title,
                body: body,
            }),
        });
    } catch (e) {
        console.error("Failed to send push notification", e);
    }
}

export async function POST(request: Request) {
    try {
        const session = await getAuthSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { id, action } = body;

        if (!id || !action || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        // Fetch the emergency appointment
        const { data: emergencyAppt, error: fetchErr } = await supabase
            .from("appointments")
            .select("*, patients!patient_id(expo_push_token)")
            .eq("id", id)
            .single();

        if (fetchErr || !emergencyAppt) {
            return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
        }

        if (action === 'reject') {
            await supabase.from("appointments").update({ status: 'Rejected' }).eq("id", id);

            // Send Rejection Push Notification
            const patientToken = emergencyAppt.patients?.expo_push_token;
            const rejectionTitle = "Emergency Booking Update";
            const rejectionBody = "We are sorry, your emergency appointment request could not be accommodated at this time.";

            if (patientToken) {
                await sendPushNotification(
                    patientToken,
                    rejectionTitle,
                    rejectionBody
                );
            }

            // Store notification in database
            await supabase.from("notifications").insert([{
                user_id: emergencyAppt.patient_id,
                target_type: 'patient',
                title: rejectionTitle,
                body: rejectionBody,
                data: { appointmentId: id, status: 'Rejected' }
            }]);

            return NextResponse.json({ success: true, message: "Rejected" });
        }

        if (action === 'approve') {
            // Get current IST time (assuming server might be UTC, adjust accordingly, but typically local time matters)
            // To be robust, calculate based on UTC + 5:30
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const istDate = new Date(utc + (3600000 * 5.5));

            const todayStr = istDate.toISOString().split('T')[0];

            // Round to next 15 min slot
            let mins = istDate.getMinutes();
            let remainder = mins % 15;
            let addMins = 15 - remainder;

            istDate.setMinutes(mins + addMins);
            istDate.setSeconds(0);
            istDate.setMilliseconds(0);

            let hours = istDate.getHours();
            const finalMins = istDate.getMinutes();
            const period = hours >= 12 ? 'PM' : 'AM';
            let formattedHours = hours % 12 || 12;

            // Format HH:MM AM/PM
            const nextSlotStr = `${String(formattedHours).padStart(2, '0')}:${String(finalMins).padStart(2, '0')} ${period}`;

            // Fetch scheduled appointments for this doctor today
            const { data: existingAppts, error: existingErr } = await supabase
                .from("appointments")
                .select("*, patients!patient_id(expo_push_token)")
                .eq("doctor", emergencyAppt.doctor)
                .eq("date", todayStr)
                .in("status", ["Scheduled", "Confirmed"]);

            if (existingErr) {
                throw existingErr;
            }

            const nextSlotMinutes = timeToMinutes(nextSlotStr);

            // Filter ones that are >= nextSlotStr
            const appointmentsToShift = (existingAppts || []).filter(a => {
                if (!a.time || a.id === id) return false;
                return timeToMinutes(a.time) >= nextSlotMinutes;
            });

            // Update the emergency appointment itself
            await supabase.from("appointments").update({
                date: todayStr,
                time: nextSlotStr,
                status: 'Awaiting Payment'
            }).eq("id", id);

            // Notify emergency patient
            const patientToken = emergencyAppt.patients?.expo_push_token;
            console.log("Patient Token", patientToken);
            
            const notificationTitle = "Emergency Approved - Payment Required";
            const notificationBody = `Your emergency appointment for ${nextSlotStr} is approved. Please open the app to pay the booking fee and unlock your meeting link.`;

            if (patientToken) {
                await sendPushNotification(
                    patientToken,
                    notificationTitle,
                    notificationBody
                );
            }

            // Store notification in database for patient
            await supabase.from("notifications").insert([{
                user_id: emergencyAppt.patient_id,
                target_type: 'patient',
                title: notificationTitle,
                body: notificationBody,
                data: { appointmentId: id, assignedTime: nextSlotStr }
            }]);

            // Cascade update for remaining appointments
            for (const appt of appointmentsToShift) {
                const newTime = add15Minutes(appt.time);
                await supabase.from("appointments").update({
                    time: newTime
                }).eq("id", appt.id);

                const delayTitle = "Appointment Delayed";
                const delayBody = `Your doctor is attending to a medical emergency. To ensure you get a full consultation, your appointment time has been adjusted to ${newTime}.`;

                // Send notification to shifted patient
                const shiftedPatientToken = appt.patients?.expo_push_token;
                if (shiftedPatientToken) {
                    await sendPushNotification(
                        shiftedPatientToken,
                        delayTitle,
                        delayBody
                    );
                }

                // Store notification in database for shifted patient
                await supabase.from("notifications").insert([{
                    user_id: appt.patient_id,
                    target_type: 'patient',
                    title: delayTitle,
                    body: delayBody,
                    data: { appointmentId: appt.id, newTime }
                }]);
            }

            return NextResponse.json({
                success: true,
                message: "Approved",
                assignedTime: nextSlotStr,
                shiftedCount: appointmentsToShift.length
            });
        }

    } catch (error: any) {
        console.error("Failed to process emergency booking:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
