const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const SYSTEM_INSTRUCTION = "Bạn là Blocklands AI, trợ lý Minecraft thân thiện. Trả lời bằng tiếng Việt rõ ràng, thực tế. Hỗ trợ sinh tồn, chế tạo, quái vật, redstone, quần xã và ý tưởng xây dựng. Hỏi lại phiên bản Java/Bedrock khi cần. Không bịa công thức hoặc khẳng định chắc chắn khi không biết. Bạn không đại diện chính thức cho Mojang hay Microsoft.";

export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) {
    return Response.json(
      { error: "Chưa cấu hình API Gemini. Hãy thêm GEMINI_API_KEY trong Cloudflare Pages → Settings → Variables and Secrets." },
      { status: 503, headers: jsonHeaders }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400, headers: jsonHeaders });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json({ error: "Hãy nhập câu hỏi trước nhé." }, { status: 400, headers: jsonHeaders });
  }

  const messages = body.messages
    .filter((m) => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
    .slice(-12)
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content.slice(0, 1500) }] }));

  if (!messages.length || !messages.some((m) => m.role === "user")) {
    return Response.json({ error: "Không tìm thấy câu hỏi hợp lệ." }, { status: 400, headers: jsonHeaders });
  }

  try {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: messages,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      // Log technical details server-side only; never return the key or upstream payload to visitors.
      console.error("Gemini API request failed", upstream.status, data?.error?.status || data?.error?.message || "Unknown error");
      if (upstream.status === 400 || upstream.status === 403 || upstream.status === 404) {
        return Response.json(
          { error: "Gemini từ chối yêu cầu. Hãy kiểm tra API key, quyền Gemini API và tên model trong Google AI Studio." },
          { status: 502, headers: jsonHeaders }
        );
      }
      if (upstream.status === 429) {
        return Response.json(
          { error: "Gemini đang vượt giới hạn lượt gọi hoặc hạn mức. Hãy kiểm tra quota/billing của API key." },
          { status: 502, headers: jsonHeaders }
        );
      }
      return Response.json({ error: "Dịch vụ Gemini đang gặp lỗi. Hãy thử lại sau." }, { status: 502, headers: jsonHeaders });
    }

    const answer = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!answer) {
      return Response.json({ error: "Gemini chưa tạo được câu trả lời. Hãy thử lại." }, { status: 502, headers: jsonHeaders });
    }

    return Response.json({ response: answer }, { headers: jsonHeaders });
  } catch (error) {
    console.error("Gemini connection failed", error?.message || "Unknown error");
    return Response.json({ error: "Không kết nối được dịch vụ Gemini. Hãy thử lại sau." }, { status: 502, headers: jsonHeaders });
  }
}
