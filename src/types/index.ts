import type { Timestamp } from 'firebase/firestore'

export interface UserModel {
  uid: string
  email: string
  name: string
  role: 'farmer' | 'admin'
  barangay?: string
  municipality: string
  contactNumber: string
  farmCount: number
  detectionCount: number
  createdAt: Date
  lastDetectionAt?: Date
}

export interface PestRecord {
  id: string
  userId: string
  userName: string
  barangay: string
  farmId: string
  farmName: string
  detectedPest: string
  confidence: number
  pestMargin: number
  secondPest: string
  imageData: string
  recommendation: string
  pesticide: string
  dosage: string
  timing: string
  detectedAt: Date
  reviewed: boolean
  status: 'new' | 'reviewed' | 'action_taken'
  healthBand?: string
  healthCondition?: string
}

export interface AssistanceRequest {
  id: string
  farmerId: string
  farmerName: string
  farmerContact: string
  barangay: string
  farmId: string
  farmName: string
  recordId: string
  detectedPest: string
  healthBand: string
  recommendedTreatment: string
  farmerNote: string
  requestedAt: Date
  status: 'Pending' | 'Approved' | 'Distributed' | 'Completed' | 'Declined'
  pesticideSupplied: string
  quantitySupplied: string
  distributedAt?: Date
  remarks: string
  handledBy: string
  handledByName: string
  updatedAt?: Date
}

export interface Farm {
  id: string
  ownerId: string
  ownerName: string
  name: string
  barangay: string
  municipality: string
  areaHectares: number
  active: boolean
  createdAt: Date
}

// helpers
export function fromTs(ts: Timestamp | undefined | null): Date {
  return ts ? ts.toDate() : new Date()
}
