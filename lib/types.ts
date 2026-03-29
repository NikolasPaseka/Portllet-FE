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
  livePriceUsd: number | null
  totalValueUsd: number | null
}

export interface CryptoEntry {
  id: string
  name: string
  symbol: string
  amount: number
  livePriceUsd: number | null
  totalValueUsd: number | null
}

export interface OtherAsset {
  id: string
  name: string
  value: number
  currency: Currency
  note: string
}

export interface DocumentEntry {
  id: string
  name: string
  description: string
  dateAdded: string
  fileType: string
  fileSize: string
  tags: string[]
}

export type Section = "balance" | "contracts" | "receipts" | "diplomas"
