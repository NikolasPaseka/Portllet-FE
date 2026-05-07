export type Currency = "CZK" | "USD"

export interface CashBalance {
  amount: number
  currency: Currency
}

export type BankAccountType = "common" | "saving"

export interface Envelope {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
}

export interface BankAccount {
  id: string
  name: string
  bankName: string
  type: BankAccountType
  balance: number
  currency: Currency
  interestRate?: number // annual interest rate for saving accounts (%)
  envelopes?: Envelope[]
}

export interface StockEntry {
  id: string
  name: string
  ticker: string
  shares: number
  source?: string
  livePriceUsd: number | null
  totalValueUsd: number | null
}

export interface CryptoEntry {
  id: string
  name: string
  symbol: string
  amount: number
  source?: string
  livePriceUsd: number | null
  totalValueUsd: number | null
}

export interface OtherAsset {
  id: string
  name: string
  value: number
  currency: Currency
  note?: string
  source?: string
}

export type Section = "balance" | "settings" | "calendar" | "todo"

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: string
  end: string
  colorId?: string
  attendees?: { email: string; displayName?: string }[]
  isAllDay: boolean
  calendarId?: string
  calendarName?: string
  calendarColor?: string
}

export interface GoogleAccountStatus {
  connected: boolean
  email?: string
}

export type RepeatType = "none" | "daily" | "weekly" | "monthly"

export interface TodoSubtask {
  id: string
  title: string
  completed: boolean
  position: number
}

export interface TodoTask {
  id: string
  title: string
  description?: string
  dueDate?: string
  duration?: number
  repeat: RepeatType
  completed: boolean
  position: number
  subtasks: TodoSubtask[]
  sectionId?: string
}

export interface TodoSection {
  id: string
  name: string
  color: string
  position: number
  tasks: TodoTask[]
}
