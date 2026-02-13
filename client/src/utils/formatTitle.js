// Removes common course prefix so cards don't all look identical.
// Works for titles like:
// "Git & GitHub Foundations (Corporate Track): Version Control Basics (beginner) — Video"
// => "Version Control Basics (beginner) — Video"

export function formatTitle(title) {
  if (!title) return "";

  return title
    .replace(/^.*?:\s*/, "")                 // remove "Course Name: "
    .replace(/\(Corporate Track\)/gi, "")    // optional: remove track tag if repeated
    .replace(/\s{2,}/g, " ")                 // collapse spaces
    .trim();
}
