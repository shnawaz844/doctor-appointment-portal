require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
const API_URL = 'http://localhost:3000/api/opd-online'
const API_KEY = 'doctor-portal-secure-2026'

async function verify() {
    const testCitizenId = 'TEST-UCCN-' + Date.now()
    const payload = {
        patientName: "Test User",
        citizenId: testCitizenId,
        phone: "9999999999",
        doctorId: "doc-1",
        doctorName: "Dr. Test",
        specialty: "General",
        date: "2026-04-10",
        time: "10:00 AM",
        age: "30",
        gender: "Male",
        medicalReports: ["https://example.com/report.pdf"],
        prescriptions: ["https://example.com/rx.jpg"],
        imaging: ["https://example.com/img.jpg"]
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
        console.log('Booking response data:', JSON.stringify(data, null, 2))

        if (!response.ok) {
            throw new Error(data.error || 'Request failed')
        }

        const { appointment } = data

        console.log('--- Verifying in Database ---')

        // 1. Check Appointment
        const { data: appt } = await sb.from('appointments').select('*').eq('id', appointment.id).single()
        console.log('Appointment UCCN:', appt?.unique_citizen_card_number === testCitizenId ? '✅ OK' : '❌ FAIL (' + appt?.unique_citizen_card_number + ')')

        // 2. Check Medical Records
        const { data: records } = await sb.from('medicalrecords').select('*').eq('unique_citizen_card_number', testCitizenId)
        console.log('Medical Records count:', records?.length)
        if (records?.length === 2) {
            console.log('Medical Records UCCN:', '✅ OK')
        } else {
            console.log('Medical Records UCCN:', '❌ FAIL (Expected 2 records)')
        }

        // 3. Check Imaging
        const { data: imaging } = await sb.from('imagingstudies').select('*').eq('unique_citizen_card_number', testCitizenId)
        console.log('Imaging Records count:', imaging?.length)
        if (imaging?.length === 1) {
            console.log('Imaging Records UCCN:', '✅ OK')
        } else {
            console.log('Imaging Records UCCN:', '❌ FAIL (Expected 1 record)')
        }

    } catch (err) {
        console.error('Verification failed:', err.message)
    }
}

verify()
