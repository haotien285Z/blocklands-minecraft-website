const corsHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

export async function onRequestPost({ request, env }) {
  if (!env.AI) {
    return Response.json(
      { error: "Workers AI chưa được kết nối. Quản trị viên cần thêm binding tên AI trong Cloudflare Pages." },
      { status: 503, headers: corsHeaders }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400, headers: corsHeaders });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json({ error: "Hãy nhập câu hỏi trước nhé." }, { status: 400, headers: corsHeaders });
  }

  const messages = body.messages
    .filter((m) => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));

  if (!messages.length || !messages.some((m) => m.role === "user")) {
    return Response.json({ error: "Không tìm thấy câu hỏi hợp lệ." }, { status: 400, headers: corsHeaders });
  }

  try {
    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fp8", {
      messages: [
        {
          role: "system",
          content: "Bạn là Blocklands AI, trợ lý Minecraft thân thiện, trả lời bằng tiếng Việt rõ ràng và thực tế. Ưu tiên Minecraft Java/Bedrock nhưng hỏi lại phiên bản nếu khác biệt quan trọng. Giải thích từng bước về sinh tồn, chế tạo, quái vật, redstone, quần xã và ý tưởng xây dựng. Không bịa công thức hoặc khẳng định chắc chắn khi không biết; nói rõ khi cần kiểm tra phiên bản. Bạn không đại diện chính thức cho Mojang hay Microsoft."
        },
        ...messages
      ]
    });
    const response = result?.response;
    if (typeof response !== "string" || !response.trim()) {
      return Response.json({ error: "AI chưa tạo được câu trả lời. Hãy thử lại." }, { status: 502, headers: corsHeaders });
    }
    return Response.json({ response }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: "Dịch vụ AI gặp lỗi. Hãy thử lại sau." }, { status: 502, headers: corsHeaders });
  }
}
