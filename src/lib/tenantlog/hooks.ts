import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAllIssues,
  getIssue,
  getEntriesByIssue,
  getAttachmentsByEntry,
  createIssueWithEntries,
  addEntry,
  updateIssueStatus,
  deleteIssue,
  seedDemoData,
  clearAllData,
} from './store'
import type { NewIssueInput, NewEntryInput, IssueStatus } from './types'

export function useIssues() {
  return useQuery({
    queryKey: ['issues'],
    queryFn: getAllIssues,
  })
}

export function useIssue(id: string | undefined) {
  return useQuery({
    queryKey: ['issue', id],
    queryFn: () => (id ? getIssue(id) : Promise.resolve(undefined)),
    enabled: !!id,
  })
}

export function useEntries(issueId: string | undefined) {
  return useQuery({
    queryKey: ['entries', issueId],
    queryFn: () => (issueId ? getEntriesByIssue(issueId) : Promise.resolve([])),
    enabled: !!issueId,
  })
}

export function useEntryAttachments(entryId: string | undefined) {
  return useQuery({
    queryKey: ['attachments', 'entry', entryId],
    queryFn: () => (entryId ? getAttachmentsByEntry(entryId) : Promise.resolve([])),
    enabled: !!entryId,
  })
}

export function useCreateIssue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: NewIssueInput) => createIssueWithEntries(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issues'] })
    },
  })
}

export function useAddEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: NewEntryInput) => addEntry(input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['entries', variables.issueId] })
      qc.invalidateQueries({ queryKey: ['issues'] })
    },
  })
}

export function useUpdateIssueStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: IssueStatus }) =>
      updateIssueStatus(id, status),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['issue', variables.id] })
      qc.invalidateQueries({ queryKey: ['issues'] })
    },
  })
}

export function useDeleteIssue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteIssue(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issues'] })
    },
  })
}

export function useSeedDemo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: seedDemoData,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issues'] })
    },
  })
}

export function useClearAll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: clearAllData,
    onSuccess: () => {
      qc.invalidateQueries()
    },
  })
}
