require('dotenv').config({path: '.env.local'})
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
const API_URL = 'http://localhost:3000/api/opd-online'
const API_KEY = 'pgf-opd-key-2026'

async function verify() {
    const testCitizenId = 'TEST-RX-FIX-' + Date.now()
    const payload = {
        patientName: "Ankit Singh",
        citizenId: testCitizenId,
        phone: "9999999999",
        doctorId: "doc-1",
        doctorName: "Dr. Test",
        specialty: "General",
        date: "2026-04-10",
        time: "10:30 AM",
        age: "30",
        gender: "Male",
        medicalReports: ["https://example.com/med_report.pdf"],
        prescriptions: ["https://example.com/pgf_prescription.jpg"],
        imaging: ["https://example.com/imaging_study.jpg"]
    }

    console.log('Sending mock booking request with citizenId:', testCitizenId)
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 
                'x-api-key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        
        const data = await response.json()
        console.log('Booking response status:', response.status)
        
        if (!response.ok) {
            console.error('Data:', JSON.stringify(data, null, 2))
            throw new Error(data.error || 'Request failed')
        }

        const { appointment, uhid } = data
        console.log('Created Appointment:', appointment.id)
        console.log('UHID:', uhid)

        console.log('--- Verifying in Database ---')
        
        // 1. Check Medical Records (Should have 1 record)
        const { data: records } = await sb.from('medicalrecords')
            .select('*')
            .eq('unique_citizen_card_number', testCitizenId)
        console.log('Medical Records count (expected 1):', records?.length)
        if (records?.length === 1) {
            console.log('Medical Record Result: ✅ OK')
        } else {
            console.log('Medical Record Result: ❌ FAIL')
        }

        // 2. Check Prescriptions (Should have 1 record)
        const { data: rxData } = await sb.from('prescriptions')
            .select('*')
            .eq('unique_citizen_card_number', testCitizenId)
        console.log('Prescriptions count (expected 1):', rxData?.length)
        if (rxData?.length === 1) {
            console.log('Prescription Result: ✅ OK')
            console.log('Prescription ID:', rxData[0].id)
            console.log('Attachment URL:', rxData[0].attachment_url)
            
            // Check if linked to appointment
            const { data: apptCheck } = await sb.from('appointments')
                .select('prescription_id')
                .eq('id', appointment.id)
                .single()
            if (apptCheck?.prescription_id === rxData[0].id) {
                console.log('Appointment Link: ✅ OK')
            } else {
                console.log('Appointment Link: ❌ FAIL (Expected ' + rxData[0].id + ', got ' + apptCheck?.prescription_id + ')')
            }
        } else {
            console.log('Prescription Result: ❌ FAIL')
        }

        // 3. Check Imaging
        const { data: imaging } = await sb.from('imagingstudies')
            .select('*')
            .eq('unique_citizen_card_number', testCitizenId)
        console.log('Imaging Records count (expected 1):', imaging?.length)
        if (imaging?.length === 1) {
            console.log('Imaging Result: ✅ OK')
        } else {
            console.log('Imaging Result: ❌ FAIL')
        }

    } catch (err) {
        console.error('Verification failed:', err.message)
    }
}

verify()
