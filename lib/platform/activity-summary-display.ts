/** Normalize legacy DB copy for Ops display (hosted rows may predate migrations). */
export function displayActivitySummary(summary: string): string {
  const joinedLegacy = summary.match(/^User (.+?) \((student|teacher|parent|admin)\) joined$/i);
  if (joinedLegacy) {
    const name = joinedLegacy[1];
    const role = joinedLegacy[2].toLowerCase();
    const roleLabel =
      role === "student"
        ? "Student"
        : role === "teacher"
          ? "Teacher"
          : role === "parent"
            ? "Parent"
            : "School administrator";
    return `${roleLabel} added: ${name}`;
  }

  if (/^User .+ joined$/i.test(summary)) {
    return summary.replace(/\bjoined\b/i, "added");
  }

  return summary.replace(/\bjoined\b/gi, "added");
}
