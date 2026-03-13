// Event status
export enum EventStatus {
  Active = "active",
  Completed = "completed",
  Draft = "draft",
}

// Deal status (no Washout)
export enum DealStatus {
  Pending = "pending",
  Funded = "funded",
  Unwound = "unwound",
  Cancelled = "cancelled",
}

// New/Used classification
export enum NewUsed {
  New = "New",
  Used = "Used",
}

// Salesperson type (rep | manager | team_leader)
export enum SalespersonType {
  Rep = "rep",
  Manager = "manager",
  TeamLeader = "team_leader",
}

// User role
export enum UserRole {
  Admin = "admin",
  Staff = "staff",
  Readonly = "readonly",
}
