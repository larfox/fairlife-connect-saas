import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ScreeningSummaryRequest {
  patientEmail: string;
  patientName: string;
  screeningData: {
    weight?: number;
    height?: number;
    bmi?: number;
    blood_pressure_systolic?: number;
    blood_pressure_diastolic?: number;
    heart_rate?: number;
    temperature?: number;
    oxygen_saturation?: number;
    blood_sugar?: number;
    notes?: string;
  };
  eventName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patientEmail, patientName, screeningData, eventName }: ScreeningSummaryRequest = await req.json();

    if (!patientEmail || !patientName) {
      return new Response(
        JSON.stringify({ error: "Patient email and name are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Format the screening data for the email
    const formatValue = (value: any, unit?: string) => {
      if (value === null || value === undefined) return "Not recorded";
      return `${value}${unit ? ` ${unit}` : ""}`;
    };

    const getBloodPressureStatus = (systolic?: number, diastolic?: number) => {
      if (!systolic || !diastolic) return "";
      if (systolic < 120 && diastolic < 80) return " (Normal)";
      if (systolic < 130 && diastolic < 80) return " (Elevated)";
      if (systolic < 140 || diastolic < 90) return " (High Blood Pressure Stage 1)";
      return " (High Blood Pressure Stage 2)";
    };

    const getBMIStatus = (bmi?: number) => {
      if (!bmi) return "";
      if (bmi < 18.5) return " (Underweight)";
      if (bmi < 25) return " (Normal weight)";
      if (bmi < 30) return " (Overweight)";
      return " (Obese)";
    };

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb; text-align: center;">Health Screening Summary</h1>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #1e40af; margin-top: 0;">Patient Information</h2>
          <p><strong>Name:</strong> ${patientName}</p>
          ${eventName ? `<p><strong>Event:</strong> ${eventName}</p>` : ""}
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #1e40af; margin-top: 0;">Vital Signs</h2>
          
          <div style="display: grid; gap: 10px;">
            <p><strong>Weight:</strong> ${formatValue(screeningData.weight, "lbs")}</p>
            <p><strong>Height:</strong> ${formatValue(screeningData.height, "ft")}</p>
            <p><strong>BMI:</strong> ${formatValue(screeningData.bmi?.toFixed(1))}${getBMIStatus(screeningData.bmi)}</p>
            <p><strong>Blood Pressure:</strong> ${screeningData.blood_pressure_systolic && screeningData.blood_pressure_diastolic 
              ? `${screeningData.blood_pressure_systolic}/${screeningData.blood_pressure_diastolic} mmHg${getBloodPressureStatus(screeningData.blood_pressure_systolic, screeningData.blood_pressure_diastolic)}`
              : "Not recorded"}</p>
            <p><strong>Heart Rate:</strong> ${formatValue(screeningData.heart_rate, "bpm")}</p>
            <p><strong>Temperature:</strong> ${formatValue(screeningData.temperature, "°F")}</p>
            <p><strong>Oxygen Saturation:</strong> ${formatValue(screeningData.oxygen_saturation, "%")}</p>
            <p><strong>Blood Sugar:</strong> ${formatValue(screeningData.blood_sugar, "mg/dL")}</p>
          </div>
        </div>

        ${screeningData.notes ? `
        <div style="background-color: #fefce8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #a16207; margin-top: 0;">Additional Notes</h2>
          <p style="white-space: pre-wrap;">${screeningData.notes}</p>
        </div>
        ` : ""}

        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 0; color: #991b1b;">
            <strong>Important:</strong> This screening summary is for informational purposes only. 
            Please consult with a healthcare professional for proper medical advice and follow-up care.
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Thank you for participating in our health screening program.
          </p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Health Screening <onboarding@resend.dev>",
      to: [patientEmail],
      subject: `Your Health Screening Summary - ${new Date().toLocaleDateString()}`,
      html: emailHtml,
    });

    console.log("Screening summary email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, messageId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-screening-summary function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);