import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPhoneWithPrefix } from "@/lib/phone"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { User, Phone, Mail, Calendar, FileText, Download, ExternalLink, ArrowLeft, Pill, Plus, FileImage, Eye, Beaker, Paperclip } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ImagingStudies } from "@/components/imaging-studies"
import { CreateImagingDialog } from "@/components/create-imaging-dialog"
import Link from "next/link"
import { CreateMedicalRecordDialog } from "@/components/create-medical-record-dialog"
import { CreateAppointmentDialog } from "@/components/create-appointment-dialog"
import { ViewReportDialog } from "@/components/view-report-dialog"
import { CreatePrescriptionDialog } from "@/components/create-prescription-dialog"
import { DeletePrescriptionDialog } from "@/components/delete-prescription-dialog"
import { ViewMedicalRecordDialog } from "@/components/view-medical-record-dialog"
import { ViewPrescriptionDialog } from "@/components/view-prescription-dialog"
import { FileSignature, Trash2 } from "lucide-react"
import { DeleteReportDialog } from "@/components/delete-report-dialog"
import { ViewAttachmentButton } from "@/components/view-attachment-button"

export default async function PatientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Fetch patient data first to get UCCN for other queries
  const { data: patient } = await supabase.from("patients").select("*").eq("id", id).single()

  if (!patient) {
    return (
      <main className="flex-1">
        <div className="container py-8 px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-2">Patient Not Found</h2>
            <p className="text-muted-foreground mb-4">The patient you're looking for doesn't exist.</p>
            <Link href="/patients">
              <Button>Back to Patients</Button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const uccn = patient.unique_citizen_card_number

  // Fetch all other data in parallel
  const [
    { data: patientReportsData },
    { data: patientAppointmentsData },
    { data: patientMedicalRecordsData },
    { data: patientImagingStudiesData },
    { data: patientPrescriptionsData },
    { data: patientLabResultsData },
    { data: specialtiesData }
  ] = await Promise.all([
    supabase.from("reports")
      .select("*")
      .or(`patient_id.eq.${id}${uccn ? `,unique_citizen_card_number.eq.${uccn}` : ""}`),
    supabase.from("appointments")
      .select("*")
      .or(`patient_id.eq.${id}${uccn ? `,unique_citizen_card_number.eq.${uccn}` : ""}`)
      .order("date", { ascending: false }),
    supabase.from("medicalrecords")
      .select("*")
      .or(`patient_id.eq.${id}${uccn ? `,unique_citizen_card_number.eq.${uccn}` : ""}`)
      .order("created_at", { ascending: false }),
    supabase.from("imagingstudies")
      .select("*")
      .or(`patient_id.eq.${id}${uccn ? `,unique_citizen_card_number.eq.${uccn}` : ""}`)
      .order("created_at", { ascending: false }),
    supabase.from("prescriptions")
      .select("*")
      .or(`patient_id.eq.${id}${uccn ? `,unique_citizen_card_number.eq.${uccn}` : ""}`)
      .order("issued", { ascending: false }),
    supabase.from("labresults")
      .select("*")
      .or(`patient_id.eq.${id}${uccn ? `,patient_name.ilike.%${patient.name}%` : ""}`)
      .order("date", { ascending: false }),
    supabase.from("specialties").select("*")
  ])

  const patientReports = patientReportsData || []
  const patientAppointments = patientAppointmentsData || []
  const patientMedicalRecords = patientMedicalRecordsData || []
  const patientImagingStudies = patientImagingStudiesData || []
  const patientPrescriptions = patientPrescriptionsData || []
  const patientLabResults = patientLabResultsData || []
  const specialties = specialtiesData || []

  // Fetch doctor's specialty based on patient.doctor or patient.diagnosis
  let doctorSpecialty = "General"

  if (patient?.doctor || patient?.diagnosis) {
    // 1. Try to find the doctor in the doctors table
    if (patient.doctor) {
      const cleanedName = patient.doctor.replace(/^Dr\.\s*/i, "").trim();
      const { data: doctorData } = await supabase
        .from("doctors")
        .select("*")
        .or(`name.ilike.%${cleanedName}%, name.eq.${patient.doctor}`)
        .maybeSingle();

      if (doctorData?.specialty_id) {
        // MANUAL JOIN: find the specialty name in the specialties list
        const foundSpecialty = specialties.find((s: any) => s.id === doctorData.specialty_id || s._id === doctorData.specialty_id);
        if (foundSpecialty) {
          doctorSpecialty = foundSpecialty.name;
        }
      }
    }

    // 2. Fallback: If doctor specialty is still General, check diagnosis keywords
    if (doctorSpecialty === "General" && patient.diagnosis) {
      doctorSpecialty = patient.diagnosis;
    }
  }

  // Imaging specialty mapping
  const getImagingDescription = (specialty: any) => {
    const s = (typeof specialty === 'string' ? specialty : specialty?.name || "").toLowerCase().trim();

    if (s.includes("cardio")) return "Echocardiogram, Stress Test, ECG, and Cardiac MRI"
    if (s.includes("neuro")) return "Brain MRI, CT Head, EEG, and Nerve Conduction Studies"
    if (s.includes("ortho")) return "X-rays, Joint MRI, Bone CT scan, and Arthroscopy"
    if (s.includes("gastro")) return "Endoscopy, Colonoscopy, Abdominal Ultrasound, and Gastric Emptying Study"
    if (s.includes("dental") || s.includes("dentist")) return "Dental X-rays, OPG, and CBCT"
    if (s.includes("physio") || s.includes("rehab")) return "Functional Assessment, Gait Analysis, and Range of Motion Testing"
    if (s.includes("chest") || s.includes("pulmono")) return "Chest X-ray, CT Thorax, and Lung Ultrasound"

    return "X-rays, CT scans, MRI, and ultrasound imaging"
  }


  // Group reports by type
  const reportsByType = patientReports.reduce(
    (acc: Record<string, any[]>, report: any) => {
      if (!acc[report.type]) {
        acc[report.type] = []
      }
      acc[report.type].push(report)
      return acc
    },
    {} as Record<string, any[]>,
  )

  // Separate uploaded prescription files from general medical records
  const uploadedPrescriptions = patientMedicalRecords.filter(r =>
    r.record_type === "Prescription" || r.summary?.includes("(Prescription)")
  )
  const filteredMedicalRecords = patientMedicalRecords.filter(r =>
    r.record_type !== "Prescription" && !r.summary?.includes("(Prescription)")
  )

  return (
    <main className="flex-1 min-h-screen overflow-x-hidden overflow-y-auto">
      <div className="container mx-auto py-6 md:py-8 px-4 md:px-8">
        {/* Back button */}
        <Link href="/patients">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{patient.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="outline" className="font-mono border-slate-200 dark:border-slate-800">
                  {patient.id}
                </Badge>
                <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-none">{patient.diagnosis}</Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <CreateMedicalRecordDialog preselectedPatientId={patient.id}>
                <Button variant="ghost" className="rounded-full px-6 bg-slate-50 border border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 transition-all">
                  <FileText className="h-4 w-4 mr-2" />
                  Add Report
                </Button>
              </CreateMedicalRecordDialog>
              <CreatePrescriptionDialog preselectedPatientId={patient.id}>
                <Button className="rounded-full px-6 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900 transition-all font-bold">
                  <FileSignature className="h-4 w-4 mr-2" />
                  Create Prescription
                </Button>
              </CreatePrescriptionDialog>
              <CreateAppointmentDialog preselectedPatientId={patient.id}>
                <Button className="rounded-full px-6 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900 transition-all font-bold">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Visit
                </Button>
              </CreateAppointmentDialog>
            </div>
          </div>
        </div>


        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="mb-8 flex-wrap h-auto gap-1 bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Overview</TabsTrigger>
            <TabsTrigger value="visits" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Visits & Appointments</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Medical Reports</TabsTrigger>
            <TabsTrigger value="lab-results" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Lab Results</TabsTrigger>
            <TabsTrigger value="prescriptions" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Prescriptions</TabsTrigger>
            <TabsTrigger value="imaging" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Imaging</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Demographics */}
              <Card className="rounded-3xl border-none shadow-xl bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl transition-all">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                  <CardTitle className="text-xl font-black text-slate-900 dark:text-white">Demographics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Name</p>
                      <p className="text-base font-medium text-foreground">{patient.name}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Age & Gender</p>
                      <p className="text-base font-medium text-foreground">
                        {patient.age} years • {patient.gender}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p className="text-base font-medium text-foreground">{formatPhoneWithPrefix(patient.phone)}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-base font-medium text-foreground">
                        {patient.name.toLowerCase().replace(" ", ".")}@email.com
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medical Information */}
              <Card className="rounded-3xl border-none shadow-xl bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl transition-all">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                  <CardTitle className="text-xl font-black text-slate-900 dark:text-white">Medical Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Primary Diagnosis</p>
                    <Badge className="text-sm">{patient.diagnosis}</Badge>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Attending Doctor</p>
                    <p className="text-base font-medium text-foreground">{patientAppointments[0]?.doctor || patient.doctor || "N/A"}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Last Visit</p>
                    <p className="text-base font-medium text-foreground">{patientAppointments[0]?.date || patient.last_visit || "N/A"}</p>
                  </div>
                  {patientAppointments[0]?.notes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium mb-2 text-[#155dfc]">Appointment Notes</p>
                        {(() => {
                          const notes = patientAppointments[0].notes;
                          const tagMatch = notes.match(/\[.*?\]/);
                          if (tagMatch) {
                            const tag = tagMatch[0];
                            const content = notes.replace(tag, "").trim();
                            return (
                              <div className="space-y-2">
                                {content && <p className="text-base font-bold text-foreground leading-tight">{content}</p>}
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-slate-100 dark:bg-slate-900 w-fit px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                                  {tag}
                                </p>
                              </div>
                            );
                          }
                          return <p className="text-base font-medium text-foreground ">"{notes}"</p>;
                        })()}
                      </div>
                    </>
                  )}
                  <Separator />
                  {/* <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Known Allergies</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="destructive">Penicillin</Badge>
                      <Badge variant="destructive">NSAIDs</Badge>
                    </div>
                  </div> */}
                </CardContent>
              </Card>
            </div>
            {/* 
            <Card>
              <CardHeader>
                <CardTitle>More Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Date of Consultation</p>
                    <p className="text-base font-medium text-foreground">{patient.injury_date || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card> */}
          </TabsContent>

          {/* Visits & Appointments Tab */}
          <TabsContent value="visits" className="space-y-6">
            <Card className="rounded-3xl border-none shadow-xl bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-xl font-black text-slate-900 dark:text-white">Visit History</CardTitle>
                <CardDescription className="text-sm font-medium text-slate-500">Past appointments and consultations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patientAppointments.length > 0 ? (
                    patientAppointments.map((apt: any) => (
                      <div key={apt.id} className="flex flex-col gap-2 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:bg-white dark:hover:bg-slate-900 transition-all">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-slate-900 dark:text-white truncate">{apt.type} - {apt.specialty}</p>
                              <Badge variant="outline" className="h-5 text-[9px] font-black uppercase tracking-widest">{apt.status}</Badge>
                            </div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{apt.date} at {apt.time} • {apt.doctor}</p>
                          </div>
                        </div>
                        {apt.notes && (
                          <div className="mt-2 pl-14">
                            {(() => {
                              const tagMatch = apt.notes.match(/\[.*?\]/);
                              if (tagMatch) {
                                const tag = tagMatch[0];
                                const content = apt.notes.replace(tag, "").trim();
                                return (
                                  <div className="space-y-1.5">
                                    {content && <p className="text-xs text-slate-600 dark:text-slate-400 font-medium italic">"{content}"</p>}
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest bg-slate-100 dark:bg-slate-900 w-fit px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                                      {tag}
                                    </p>
                                  </div>
                                );
                              }
                              return <p className="text-xs text-slate-600 dark:text-slate-400 font-medium italic">"{apt.notes}"</p>;
                            })()}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                      <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-bold opacity-50 uppercase tracking-widest">No visits or appointments found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card className="rounded-3xl border-none shadow-xl bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
                <div>
                  <CardTitle className="text-xl font-black text-slate-900 dark:text-white">Medical Reports</CardTitle>
                  <CardDescription className="text-sm font-medium text-slate-500">Imaging and diagnostic reports organized by type</CardDescription>
                </div>
                <CreateMedicalRecordDialog preselectedPatientId={id}>
                  <Button className="rounded-full px-6 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900 transition-all font-bold">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Report
                  </Button>
                </CreateMedicalRecordDialog>
              </CardHeader>
              <CardContent className="space-y-6 px-4 md:px-8">
                {filteredMedicalRecords.length > 0 ? (
                  <div className="space-y-3">
                    {filteredMedicalRecords.map((record: any) => (
                      <div
                        key={record.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all gap-4"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="h-14 w-14 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                            <FileText className="h-7 w-7 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{record.record_type === 'Progress Notes' ? 'Medical Report' : record.record_type}</p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <span>{record.date}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300" />
                              <span>Dr. {record.doctor}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-1 italic">"{record.summary}"</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <Badge variant={record.status === "Active" ? "default" : "secondary"} className="h-6 rounded-full px-3 text-[9px] font-black tracking-widest uppercase">
                            {record.status}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {record.attachment_url && (
                              <a
                                href={record.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-8 w-8 flex items-center justify-center rounded-lg text-[#155dfc] hover:bg-[#155dfc]/10 transition-all"
                                title="View Attachment"
                              >
                                {record.attachment_type?.startsWith("image/") ? (
                                  <FileImage className="h-4 w-4" />
                                ) : (
                                  <ExternalLink className="h-4 w-4" />
                                )}
                              </a>
                            )}
                            <ViewMedicalRecordDialog record={record}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-600 transition-all" title="View Details">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </ViewMedicalRecordDialog>
                            <DeleteReportDialog reportId={record.id} reportType={record.record_type}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-all" title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DeleteReportDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-bold opacity-50 uppercase tracking-widest">No medical records found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lab Results Tab */}
          <TabsContent value="lab-results" className="space-y-6">
            <Card className="rounded-3xl border-none shadow-xl bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
                <div>
                  <CardTitle className="text-xl font-black text-slate-900 dark:text-white">Lab Results</CardTitle>
                  <CardDescription className="text-sm font-medium text-slate-500">Diagnostic lab reports and clinical test outcomes</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-4 md:px-8">
                {patientLabResults.length > 0 ? (
                  <div className="space-y-3">
                    {patientLabResults.map((result: any, index: number) => (
                      <div
                        key={result.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all gap-4 shadow-sm"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                            <Beaker className="h-6 w-6 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{result.test_name}</p>
                              {result.attachment_url && (
                                <Paperclip className="h-3.5 w-3.5 text-blue-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              <span>Sr No: {index + 1}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300" />
                              <span>{result.date}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300" />
                              <span className="text-blue-600 dark:text-blue-400">Dr. {result.doctor}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 sm:self-auto self-end">
                          <div className="text-right hidden sm:block">
                            <p className={`text-xs font-black uppercase tracking-wider ${result.result === 'Normal' ? 'text-emerald-600' :
                              result.result === 'Abnormal' ? 'text-rose-600' : 'text-amber-600'
                              }`}>
                              {result.result}
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{result.status}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {result.attachment_url && (
                              <ViewAttachmentButton
                                url={result.attachment_url}
                                type={result.attachment_type}
                                label="View File"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                    <Beaker className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-bold opacity-50 uppercase tracking-widest">No lab results found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          {/* Imaging Tab */}
          <TabsContent value="imaging" className="space-y-6">
            <Card className="rounded-3xl border-none shadow-xl bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-8 py-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl font-black text-slate-900 dark:text-white">Imaging Studies</CardTitle>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-slate-50 text-slate-400 border-slate-200">
                      {doctorSpecialty}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs font-medium text-slate-500">{getImagingDescription(doctorSpecialty)}</CardDescription>
                </div>
                <CreateImagingDialog
                  preselectedPatientId={patient.id}
                  preselectedPatientName={patient.name}
                  preselectedDoctor={patient.doctor}
                >
                  <Button className="rounded-full px-6 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900 transition-all font-bold">
                    <FileImage className="h-4 w-4 mr-2" />
                    New Imaging Study
                  </Button>
                </CreateImagingDialog>
              </CardHeader>
              <CardContent className="p-8">
                <ImagingStudies studies={patientImagingStudies} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions" className="space-y-6">
            <Card className="rounded-4xl border-none shadow-2xl bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <CardTitle className="text-xl font-black text-slate-900 dark:text-white">Prescription History</CardTitle>
                  <CardDescription className="text-xs font-medium text-slate-500">Patient's medication history and active prescriptions</CardDescription>
                </div>
                <CreatePrescriptionDialog preselectedPatientId={patient.id}>
                  <Button className="rounded-full px-6 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900 transition-all font-bold">
                    <Plus className="h-4 w-4 mr-2" />
                    New Prescription
                  </Button>
                </CreatePrescriptionDialog>
              </CardHeader>
              <CardContent className="p-4 md:p-8">
                <div className="space-y-4">
                  {patientPrescriptions.length > 0 ? (
                    patientPrescriptions.map((rx: any) => (
                      <div key={rx.id} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:bg-white dark:hover:bg-slate-900 transition-all shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={rx.status === "Active" ? "default" : "secondary"} className="rounded-full px-4 h-6 uppercase font-black text-[9px] tracking-widest">
                                {rx.status}
                              </Badge>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Issued: {rx.issued}</span>
                            </div>
                            <div className="space-y-2">
                              {rx.medications?.map((m: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Pill className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{m.medication}</p>
                                    <p className="text-[10px] text-slate-500 font-medium">{m.dosage} • {m.quantity} Units</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {rx.instructions && (
                              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Instructions</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">"{rx.instructions}"</p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2 text-right">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              <User className="h-3 w-3" />
                              <span>Dr. {rx.doctor_name}</span>
                            </div>
                            {rx.duration && (
                              <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                                Duration: {rx.duration}
                              </div>
                            )}
                            <div className="flex items-center gap-1 mt-2">
                              {rx.attachment_url && (
                                <ViewPrescriptionDialog prescription={rx}>
                                  <Button
                                    variant="ghost"
                                    className="h-8 px-3 flex items-center gap-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest"
                                    title="View Prescription Attachment"
                                  >
                                    {rx.attachment_type?.startsWith("image/") ? (
                                      <FileImage className="h-3 w-3" />
                                    ) : (
                                      <ExternalLink className="h-3 w-3" />
                                    )}
                                    View File
                                  </Button>
                                </ViewPrescriptionDialog>
                              )}
                              <DeletePrescriptionDialog prescriptionId={rx.id} medicationName={rx.medications?.[0]?.medication || "Prescription"}>
                                <Button variant="ghost" size="sm" className="h-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-all px-3">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest">Delete</span>
                                </Button>
                              </DeletePrescriptionDialog>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl mb-8">
                      <Pill className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-bold opacity-50 uppercase tracking-widest">No clinical prescriptions found</p>
                    </div>
                  )}

                  {/* Uploaded Prescription Files Section */}
                  {uploadedPrescriptions.length > 0 && (
                    <div className="mt-12 space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#155dfc]/10 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-[#155dfc]" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Uploaded Prescription Files</h3>
                      </div>

                      <div className="grid gap-4">
                        {uploadedPrescriptions.map((record: any) => (
                          <div
                            key={record.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all gap-4 shadow-sm"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                <FileImage className="h-6 w-6 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">Patient Uploaded Prescription</p>
                                <div className="flex items-center gap-2 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                  <span>{record.date}</span>
                                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                                  <span>Dr. {record.doctor}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {record.attachment_url && (
                                <a
                                  href={record.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-9 px-4 flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                                >
                                  View File
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              <DeleteReportDialog reportId={record.id} reportType="Prescription">
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-red-500 hover:bg-red-50 transition-all">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DeleteReportDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
