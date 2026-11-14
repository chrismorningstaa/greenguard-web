import { useEffect, useState } from 'react'
import {
  collection, onSnapshot, query, where, orderBy,
  doc, updateDoc, Timestamp,
} from 'firebase/firestore'
import type { DocumentData, QueryConstraint } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { fromTs } from '../types'
import type { PestRecord, UserModel, AssistanceRequest, Farm } from '../types'

function parsePestRecord(d: DocumentData, id: string): PestRecord {
  const h = d.health ?? {}
  return {
    id,
    userId: d.userId ?? '',
    userName: d.userName ?? '',
    barangay: d.barangay ?? '',
    farmId: d.farmId ?? '',
    farmName: d.farmName ?? '',
    detectedPest: d.detectedPest ?? '',
    confidence: d.confidence ?? 0,
    pestMargin: d.pestMargin ?? 1,
    secondPest: d.secondPest ?? '',
    imageData: d.imageData ?? '',
    recommendation: d.recommendation ?? '',
    pesticide: d.pesticide ?? '',
    dosage: d.dosage ?? '',
    timing: d.timing ?? '',
    detectedAt: fromTs(d.detectedAt),
    reviewed: d.reviewed ?? false,
    status: d.status ?? 'new',
    healthBand: h.band ?? '',
    healthCondition: h.condition ?? '',
  }
}

function parseUser(d: DocumentData, id: string): UserModel {
  return {
    uid: id,
    email: d.email ?? '',
    name: d.name ?? '',
    role: d.role ?? 'farmer',
    barangay: d.barangay,
    municipality: d.municipality ?? '',
    contactNumber: d.contactNumber ?? '',
    farmCount: d.farmCount ?? 0,
    detectionCount: d.detectionCount ?? 0,
    createdAt: fromTs(d.createdAt),
    lastDetectionAt: d.lastDetectionAt ? fromTs(d.lastDetectionAt) : undefined,
  }
}

function parseAssistance(d: DocumentData, id: string): AssistanceRequest {
  return {
    id,
    farmerId: d.farmerId ?? '',
    farmerName: d.farmerName ?? '',
    farmerContact: d.farmerContact ?? '',
    barangay: d.barangay ?? '',
    farmId: d.farmId ?? '',
    farmName: d.farmName ?? '',
    recordId: d.recordId ?? '',
    detectedPest: d.detectedPest ?? '',
    healthBand: d.healthBand ?? '',
    recommendedTreatment: d.recommendedTreatment ?? '',
    farmerNote: d.farmerNote ?? '',
    requestedAt: fromTs(d.requestedAt),
    status: d.status ?? 'Pending',
    pesticideSupplied: d.pesticideSupplied ?? '',
    quantitySupplied: d.quantitySupplied ?? '',
    distributedAt: d.distributedAt ? fromTs(d.distributedAt) : undefined,
    remarks: d.remarks ?? '',
    handledBy: d.handledBy ?? '',
    handledByName: d.handledByName ?? '',
    updatedAt: d.updatedAt ? fromTs(d.updatedAt) : undefined,
  }
}

export function usePestRecords() {
  const [records, setRecords] = useState<PestRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'pest_records'))
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => parsePestRecord(d.data(), d.id))
      list.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
      setRecords(list)
      setLoading(false)
    })
  }, [])

  return { records, loading }
}

export function useFarmers() {
  const [farmers, setFarmers] = useState<UserModel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'farmer'))
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => parseUser(d.data(), d.id))
      list.sort((a, b) => a.name.localeCompare(b.name))
      setFarmers(list)
      setLoading(false)
    })
  }, [])

  return { farmers, loading }
}

export function useAssistanceRequests() {
  const [requests, setRequests] = useState<AssistanceRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'assistance_requests'))
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => parseAssistance(d.data(), d.id))
      list.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime())
      setRequests(list)
      setLoading(false)
    })
  }, [])

  return { requests, loading }
}

export async function markRecordReviewed(id: string, status: string) {
  await updateDoc(doc(db, 'pest_records', id), {
    reviewed: true,
    status,
    reviewedAt: Timestamp.now(),
  })
}

export async function updateAssistanceStatus(
  id: string,
  status: string,
  fields: Record<string, string>,
  officerId: string,
  officerName: string,
) {
  await updateDoc(doc(db, 'assistance_requests', id), {
    status,
    ...fields,
    handledBy: officerId,
    handledByName: officerName,
    updatedAt: Timestamp.now(),
  })
}
