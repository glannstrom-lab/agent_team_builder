import fs from "fs";
const kund = process.argv[2];
const r = JSON.parse(fs.readFileSync(`${kund}/bygge.json`, "utf8"));
const user = `RESEARCH-DOKUMENT:\n${r.research}\n\nSKALNINGSBESLUT:\n${r.scaling}\n\nFÖRSLAG (agenterna):\n${r.proposal}\n\nSammanställ som JSON.`;
for (;;) {
  const res = await fetch("https://mittaiteam.se/api/ai", { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ step: "structure", mode: "team-builder", workstyle: "classic", messages: [{ role: "user", content: user }] }) });
  const t = await res.text();
  if (res.status === 429) { await new Promise((s) => setTimeout(s, 60000)); continue; }
  fs.writeFileSync(`${kund}/structure-raw.txt`, t);
  console.log(res.status, t.length);
  break;
}
