import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyDoc } from "@/lib/comms/model";
import {
  listOpsComposeDrafts,
  loadOpsComposeDraft,
  removeOpsComposeDraft,
  upsertOpsComposeDraft,
} from "./compose-drafts";

const memory = new Map<string, string>();

describe("ops compose drafts", () => {
  afterEach(() => {
    memory.clear();
  });

  it("keeps an unsent message and drops it when the compose is emptied or removed", () => {
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
    });
    vi.stubGlobal("window", { dispatchEvent: () => true });

    expect(
      upsertOpsComposeDraft({
        id: "draft-1",
        to: [],
        cc: [],
        subject: "",
        body: emptyDoc(),
        allowReplies: false,
        fromKey: "",
      }),
    ).toBeNull();
    expect(listOpsComposeDrafts()).toEqual([]);

    expect(
      upsertOpsComposeDraft({
        id: "draft-1",
        to: ["ana@colegio.ac.cr"],
        cc: [],
        subject: "Aviso",
        body: emptyDoc(),
        allowReplies: false,
        fromKey: "ops",
      }),
    ).toBe("draft-1");
    expect(loadOpsComposeDraft("draft-1")?.subject).toBe("Aviso");

    upsertOpsComposeDraft({
      id: "draft-1",
      to: [],
      cc: [],
      subject: "  ",
      body: emptyDoc(),
      allowReplies: false,
      fromKey: "",
    });
    expect(listOpsComposeDrafts()).toEqual([]);

    upsertOpsComposeDraft({
      id: "draft-2",
      to: ["ana@colegio.ac.cr"],
      cc: [],
      subject: "Dos",
      body: emptyDoc(),
      allowReplies: false,
      fromKey: "",
    });
    removeOpsComposeDraft("draft-2");
    expect(listOpsComposeDrafts()).toEqual([]);

    vi.unstubAllGlobals();
  });
});
