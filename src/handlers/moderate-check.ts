// Task cua state machine: gia lap quet an toan mot URL.
// Thuc te se goi mot dich vu quet (vd Google Safe Browsing); o day dung quy tac
// don gian: target chua tu cam thi coi la khong an toan.
const BLOCKLIST = ["malware", "phishing", "evil"];

export const handler = async (input: {
  code: string;
  target: string;
}): Promise<{ code: string; target: string; safe: boolean }> => {
  const lower = input.target.toLowerCase();
  const safe = !BLOCKLIST.some((w) => lower.includes(w));
  console.log("moderate-check", { code: input.code, safe });
  return { code: input.code, target: input.target, safe };
};
