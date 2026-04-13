export interface Patient {
  id: string
  name: string
  age: number
  gender: string
  phone: string
  diagnosis: string
  doctor: string
  lastVisit: string
  reportType: string
  year: string
  month: string
  laterality?: "Right" | "Left" | "Bilateral"
  severity?: "Mild" | "Moderate" | "Severe"
  injuryDate?: string
  surgeryRequired?: boolean
  physicalTherapy?: boolean
  address?: string
  guardianName?: string
  unique_citizen_card_number?: string
}

export interface Report {
  id: string
  patientId: string
  type:
  | "MRI"
  | "X-Ray"
  | "CT-Scan"
  | "Ultrasound"
  | "Physical Therapy"
  | "Surgical Notes"
  | "Prescription"
  | "Discharge"
  name: string
  date: string
  path: string
}

export interface Diagnosis {
  name: string
  count: number
  fill: string
}

export interface SearchResult {
  id: string
  patientName: string
  patientId: string
  documentType: string
  diagnosis: string
  date: string
  path: string
  aiCategory: string
  extractedFields: {
    [key: string]: string
  }
  aiTerms: string[]
  confidence: number
}

export const mockPatients: Patient[] = [
  {
    id: "P001",
    name: "Rajesh Kumar",
    age: 58,
    gender: "Male",
    phone: "+91-9876543210",
    diagnosis: "Knee Osteoarthritis",
    doctor: "Dr. Sharma",
    lastVisit: "2024-12-15",
    reportType: "X-Ray",
    year: "2024",
    month: "Dec",
    laterality: "Right",
    severity: "Moderate",
    injuryDate: "2023-06-10",
    surgeryRequired: false,
    physicalTherapy: true,
  },
  {
    id: "P002",
    name: "Priya Nair",
    age: 42,
    gender: "Female",
    phone: "+91-9876543211",
    diagnosis: "Lumbar Disc Herniation",
    doctor: "Dr. Singh",
    lastVisit: "2024-12-18",
    reportType: "MRI",
    year: "2024",
    month: "Dec",
    laterality: "Left",
    severity: "Severe",
    injuryDate: "2024-08-22",
    surgeryRequired: true,
    physicalTherapy: true,
  },
  {
    id: "P003",
    name: "Arjun Patel",
    age: 35,
    gender: "Male",
    phone: "+91-9876543212",
    diagnosis: "Rotator Cuff Tear",
    doctor: "Dr. Verma",
    lastVisit: "2024-12-19",
    reportType: "MRI",
    year: "2024",
    month: "Dec",
    laterality: "Right",
    severity: "Moderate",
    injuryDate: "2024-05-15",
    surgeryRequired: true,
    physicalTherapy: true,
  },
  {
    id: "P004",
    name: "Meera Gupta",
    age: 67,
    gender: "Female",
    phone: "+91-9876543213",
    diagnosis: "Cervical Spondylosis",
    doctor: "Dr. Sharma",
    lastVisit: "2024-12-20",
    reportType: "CT-Scan",
    year: "2024",
    month: "Dec",
    laterality: "Bilateral",
    severity: "Moderate",
    injuryDate: "2022-11-05",
    surgeryRequired: false,
    physicalTherapy: true,
  },
  {
    id: "P005",
    name: "Vikram Desai",
    age: 45,
    gender: "Male",
    phone: "+91-9876543214",
    diagnosis: "Ankle Fracture",
    doctor: "Dr. Singh",
    lastVisit: "2024-12-14",
    reportType: "X-Ray",
    year: "2024",
    month: "Dec",
    laterality: "Left",
    severity: "Moderate",
    injuryDate: "2024-10-08",
    surgeryRequired: false,
    physicalTherapy: true,
  },
  {
    id: "P006",
    name: "Anjali Reddy",
    age: 52,
    gender: "Female",
    phone: "+91-9876543215",
    diagnosis: "Meniscal Tear",
    doctor: "Dr. Verma",
    lastVisit: "2024-11-28",
    reportType: "MRI",
    year: "2024",
    month: "Nov",
    laterality: "Right",
    severity: "Mild",
    injuryDate: "2024-09-12",
    surgeryRequired: true,
    physicalTherapy: true,
  },
  {
    id: "P007",
    name: "Suresh Iyer",
    age: 48,
    gender: "Male",
    phone: "+91-9876543216",
    diagnosis: "Tendinitis",
    doctor: "Dr. Sharma",
    lastVisit: "2024-11-15",
    reportType: "Ultrasound",
    year: "2024",
    month: "Nov",
    laterality: "Left",
    severity: "Mild",
    injuryDate: "2024-07-20",
    surgeryRequired: false,
    physicalTherapy: true,
  },
  {
    id: "P008",
    name: "Divya Sharma",
    age: 36,
    gender: "Female",
    phone: "+91-9876543217",
    diagnosis: "Hip Dysplasia",
    doctor: "Dr. Singh",
    lastVisit: "2024-12-10",
    reportType: "X-Ray",
    year: "2024",
    month: "Dec",
    laterality: "Right",
    severity: "Moderate",
    injuryDate: "2023-03-18",
    surgeryRequired: true,
    physicalTherapy: true,
  },
]

export const diagnosisData: Diagnosis[] = [
  { name: "Knee Osteoarthritis", count: 342, fill: "var(--color-chart-1)" },
  { name: "Lumbar Disc Herniation", count: 287, fill: "var(--color-chart-2)" },
  { name: "Rotator Cuff Tear", count: 156, fill: "var(--color-chart-3)" },
  { name: "Cervical Spondylosis", count: 198, fill: "var(--color-chart-4)" },
  { name: "Ankle Fracture", count: 145, fill: "var(--color-chart-5)" },
  { name: "Meniscal Tear", count: 203, fill: "var(--color-chart-6)" },
  { name: "Tendinitis", count: 167, fill: "var(--color-chart-7)" },
  { name: "Hip Dysplasia", count: 112, fill: "var(--color-chart-8)" },
]

export const mockReports: Report[] = [
  {
    id: "R001",
    patientId: "P001",
    type: "X-Ray",
    name: "Knee_XRay_Bilateral.pdf",
    date: "2024-12-15",
    path: "2024 > Dec > Knee Osteoarthritis > Rajesh Kumar > X-Ray > Knee_XRay_Bilateral.pdf",
  },
  {
    id: "R002",
    patientId: "P001",
    type: "Physical Therapy",
    name: "PT_Assessment_Week3.pdf",
    date: "2024-12-15",
    path: "2024 > Dec > Knee Osteoarthritis > Rajesh Kumar > Physical Therapy > PT_Assessment_Week3.pdf",
  },
  {
    id: "R003",
    patientId: "P002",
    type: "MRI",
    name: "Lumbar_Spine_MRI_Sagittal.pdf",
    date: "2024-12-18",
    path: "2024 > Dec > Lumbar Disc Herniation > Priya Nair > MRI > Lumbar_Spine_MRI_Sagittal.pdf",
  },
  {
    id: "R004",
    patientId: "P002",
    type: "Surgical Notes",
    name: "Pre_Op_Assessment.pdf",
    date: "2024-12-12",
    path: "2024 > Dec > Lumbar Disc Herniation > Priya Nair > Surgical Notes > Pre_Op_Assessment.pdf",
  },
  {
    id: "R005",
    patientId: "P003",
    type: "MRI",
    name: "Shoulder_MRI_Right.pdf",
    date: "2024-12-19",
    path: "2024 > Dec > Rotator Cuff Tear > Arjun Patel > MRI > Shoulder_MRI_Right.pdf",
  },
  {
    id: "R006",
    patientId: "P004",
    type: "CT-Scan",
    name: "Cervical_CT_3D_Reconstruction.pdf",
    date: "2024-12-20",
    path: "2024 > Dec > Cervical Spondylosis > Meera Gupta > CT-Scan > Cervical_CT_3D_Reconstruction.pdf",
  },
]

export const extendedSearchResults: SearchResult[] = [
  {
    id: "SR001",
    patientName: "Rajesh Kumar",
    patientId: "P001",
    documentType: "X-Ray",
    diagnosis: "Knee Osteoarthritis",
    date: "2024-12-15",
    path: "2024 > Dec > Knee Osteoarthritis > Rajesh Kumar > X-Ray > Knee_XRay_Bilateral.pdf",
    aiCategory: "Knee Imaging Study",
    extractedFields: {
      "Study Type": "Knee X-Ray (AP & Lateral)",
      Laterality: "Right",
      Findings: "Moderate degenerative changes with joint space narrowing",
      Impression: "Moderate osteoarthritis",
    },
    aiTerms: ["Osteoarthritis", "Degenerative", "Joint Space Narrowing", "Osteophytes"],
    confidence: 0.95,
  },
  {
    id: "SR002",
    patientName: "Priya Nair",
    patientId: "P002",
    documentType: "MRI",
    diagnosis: "Lumbar Disc Herniation",
    date: "2024-12-18",
    path: "2024 > Dec > Lumbar Disc Herniation > Priya Nair > MRI > Lumbar_Spine_MRI.pdf",
    aiCategory: "Spinal Imaging Study",
    extractedFields: {
      "Study Type": "Lumbar Spine MRI",
      Level: "L4-L5",
      Findings: "Posterolateral disc herniation with neural compression",
      Impression: "Significant disc herniation causing radiculopathy",
    },
    aiTerms: ["Disc Herniation", "Neural Compression", "Radiculopathy", "Posterolateral"],
    confidence: 0.92,
  },
  {
    id: "SR003",
    patientName: "Arjun Patel",
    patientId: "P003",
    documentType: "Physical Therapy",
    diagnosis: "Rotator Cuff Tear",
    date: "2024-12-19",
    path: "2024 > Dec > Rotator Cuff Tear > Arjun Patel > Physical Therapy > PT_Assessment.pdf",
    aiCategory: "Physical Therapy Report",
    extractedFields: {
      "Affected Area": "Right Shoulder",
      "Assessment Type": "Range of Motion & Strength",
      Findings: "Limited abduction and external rotation",
      "Recommended Treatment": "PT rehabilitation protocol",
    },
    aiTerms: ["Rotator Cuff", "Shoulder Impingement", "ROM", "Rehabilitation"],
    confidence: 0.89,
  },
  {
    id: "SR004",
    patientName: "Meera Gupta",
    patientId: "P004",
    documentType: "CT-Scan",
    diagnosis: "Cervical Spondylosis",
    date: "2024-12-20",
    path: "2024 > Dec > Cervical Spondylosis > Meera Gupta > CT-Scan > Cervical_CT_3D.pdf",
    aiCategory: "Spinal Imaging Study",
    extractedFields: {
      "Study Type": "Cervical Spine CT with 3D Reconstruction",
      Level: "C5-C6",
      Findings: "Degenerative changes with osteophyte formation",
      Impression: "Moderate cervical spondylosis",
    },
    aiTerms: ["Spondylosis", "Osteophytes", "Degenerative Changes", "Cervical Spine"],
    confidence: 0.91,
  },
  {
    id: "SR005",
    patientName: "Vikram Desai",
    patientId: "P005",
    documentType: "X-Ray",
    diagnosis: "Ankle Fracture",
    date: "2024-12-14",
    path: "2024 > Dec > Ankle Fracture > Vikram Desai > X-Ray > Ankle_XRay_Lateral.pdf",
    aiCategory: "Ankle Imaging Study",
    extractedFields: {
      "Study Type": "Ankle X-Ray (AP, Lateral, Mortise)",
      Laterality: "Left",
      Findings: "Distal fibula fracture with minimal displacement",
      Impression: "Weber B ankle fracture",
    },
    aiTerms: ["Fracture", "Fibula", "Ankle", "Weber Classification"],
    confidence: 0.96,
  },
  {
    id: "SR006",
    patientName: "Anjali Reddy",
    patientId: "P006",
    documentType: "MRI",
    diagnosis: "Meniscal Tear",
    date: "2024-11-28",
    path: "2024 > Nov > Meniscal Tear > Anjali Reddy > MRI > Knee_MRI.pdf",
    aiCategory: "Knee Imaging Study",
    extractedFields: {
      "Study Type": "Knee MRI",
      Laterality: "Right",
      Findings: "Medial meniscus posterior horn tear",
      Impression: "Complex tear requiring arthroscopy",
    },
    aiTerms: ["Meniscal Tear", "Arthroscopy", "Medial Meniscus", "Knee"],
    confidence: 0.94,
  },
  {
    id: "SR007",
    patientName: "Suresh Iyer",
    patientId: "P007",
    documentType: "Ultrasound",
    diagnosis: "Tendinitis",
    date: "2024-11-15",
    path: "2024 > Nov > Tendinitis > Suresh Iyer > Ultrasound > Achilles_Ultrasound.pdf",
    aiCategory: "Musculoskeletal Ultrasound",
    extractedFields: {
      "Study Type": "Achilles Tendon Ultrasound",
      Laterality: "Left",
      Findings: "Tendon thickening with hypoechoic areas",
      Impression: "Achilles tendinitis",
    },
    aiTerms: ["Tendinitis", "Achilles Tendon", "Inflammation", "Ultrasound"],
    confidence: 0.88,
  },
  {
    id: "SR008",
    patientName: "Divya Sharma",
    patientId: "P008",
    documentType: "X-Ray",
    diagnosis: "Hip Dysplasia",
    date: "2024-12-10",
    path: "2024 > Dec > Hip Dysplasia > Divya Sharma > X-Ray > Hip_XRay.pdf",
    aiCategory: "Hip Imaging Study",
    extractedFields: {
      "Study Type": "Hip X-Ray (AP Pelvis)",
      Laterality: "Right",
      Findings: "Shallow acetabulum with reduced coverage",
      Impression: "Developmental hip dysplasia",
    },
    aiTerms: ["Hip Dysplasia", "Acetabulum", "Developmental", "Hip"],
    confidence: 0.9,
  },
  {
    id: "SR009",
    patientName: "Rajesh Kumar",
    patientId: "P001",
    documentType: "Physical Therapy",
    diagnosis: "Knee Osteoarthritis",
    date: "2024-11-20",
    path: "2024 > Nov > Knee Osteoarthritis > Rajesh Kumar > Physical Therapy > PT_Initial.pdf",
    aiCategory: "Physical Therapy Report",
    extractedFields: {
      "Assessment Type": "Initial Assessment",
      "Affected Area": "Right Knee",
      Findings: "Reduced flexion range, pain with weight bearing",
      "Treatment Plan": "8-week strengthening program",
    },
    aiTerms: ["Physical Therapy", "Range of Motion", "Strengthening", "Knee"],
    confidence: 0.87,
  },
  {
    id: "SR010",
    patientName: "Priya Nair",
    patientId: "P002",
    documentType: "Surgical Notes",
    diagnosis: "Lumbar Disc Herniation",
    date: "2024-10-15",
    path: "2024 > Oct > Lumbar Disc Herniation > Priya Nair > Surgical Notes > Discectomy_Notes.pdf",
    aiCategory: "Surgical Report",
    extractedFields: {
      Procedure: "Microdiscectomy L4-L5",
      Surgeon: "Dr. Singh",
      Findings: "Large sequestered disc fragment removed",
      Outcome: "Successful decompression",
    },
    aiTerms: ["Microdiscectomy", "Surgery", "Decompression", "Lumbar Spine"],
    confidence: 0.93,
  },
]
