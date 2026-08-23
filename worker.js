// ============================================================
//  WORKER — o "servidor secreto" da ferramenta
//  Ele guarda a chave da OpenAI escondida e faz a chamada.
//  A tela (index.html) fala com ESTE worker, nunca com a OpenAI
//  direto. Assim a chave nunca aparece no site.
//
//  COMO USAR (tudo no site da Cloudflare, sem terminal):
//  1. Cria conta gratis em dash.cloudflare.com
//  2. Menu "Workers & Pages" -> "Create" -> "Create Worker"
//  3. Da um nome (ex: cover-letter-api) -> Deploy
//  4. Clica em "Edit code", APAGA tudo, COLA este arquivo -> Deploy
//  5. Volta pro worker -> Settings -> Variables and Secrets
//     -> Add -> tipo "Secret" -> nome EXATO: OPENAI_API_KEY
//     -> valor: tua chave sk-... -> Save
//  6. Copia a URL do worker (algo como
//     https://cover-letter-api.SEU-NOME.workers.dev)
//     e cola no index.html no lugar indicado.
// ============================================================

// Quais sites podem chamar este worker (CORS).
// "*" libera pra qualquer origem — simples pra um projeto de portfolio.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    // Navegador manda um "OPTIONS" antes do POST (preflight do CORS).
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    // So aceita POST.
    if (request.method !== "POST") {
      return json({ error: "Use POST." }, 405);
    }

    // Le o que a tela mandou.
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid request." }, 400);
    }

    const job = (body.job || "").trim();
    const about = (body.about || "").trim();
    const tone = (body.tone || "professional and confident").trim();
    const length = (body.length || "around 250 words").trim();

    // Validacao basica.
    if (!job || !about) {
      return json({ error: "Missing job description or candidate summary." }, 400);
    }
    // Trava de tamanho: evita abuso e mantem o custo baixo.
    if (job.length > 6000 || about.length > 4000) {
      return json({ error: "Input too long. Please shorten it." }, 400);
    }

    // Monta o prompt (mesma logica de antes, agora no servidor).
    const system = "You are an expert career writer. You write concise, "
      + "genuine cover letters that connect a candidate's real experience to a "
      + "specific job. No cliches, no filler, no invented facts. Use only what "
      + "the candidate provides.";

    const user =
      "Write a cover letter, " + length + ", in a " + tone + " tone.\n\n" +
      "JOB DESCRIPTION:\n" + job + "\n\n" +
      "ABOUT THE CANDIDATE:\n" + about + "\n\n" +
      "Address it generically ('Dear Hiring Manager') and end with a sign-off. "
      + "Do not invent achievements the candidate didn't mention.";

    // Chama a OpenAI usando a chave SECRETA (env.OPENAI_API_KEY).
    try {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + env.OPENAI_API_KEY,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          temperature: 0.7,
        }),
      });

      if (!resp.ok) {
        const info = await resp.json().catch(() => ({}));
        const msg = info?.error?.message || ("Upstream error (HTTP " + resp.status + ")");
        return json({ error: msg }, 502);
      }

      const data = await resp.json();
      const letter = data.choices?.[0]?.message?.content?.trim();
      if (!letter) return json({ error: "Empty response. Try again." }, 502);

      return json({ letter }, 200);

    } catch (e) {
      return json({ error: "Server error. Try again." }, 500);
    }
  },
};

// Helper: responde em JSON com os cabecalhos de CORS.
function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
