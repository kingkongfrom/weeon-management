// Global test setup for weeon-management (docs/testing.md §16.1).
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

process.env.SUPABASE_URL ||= "http://localhost:54321";
process.env.SUPABASE_ANON_KEY ||= "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-service-role-key";

vi.mock("server-only", () => ({}));
