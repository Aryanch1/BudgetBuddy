package com.aryanmouli.budgetbuddy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Calls Google Gemini (gemini-3.5-flash-lite) through the OpenAI-compatible
 * endpoint, asking for a spending-coach summary as strict JSON.
 *
 * The API key comes from the GEMINI_API_KEY environment variable only —
 * it never appears in code, the repo, or the app. When no key is set, or
 * the call fails, the caller falls back to the rule-based demo coach
 * instead of failing the request.
 */
@Service
public class GeminiClient implements AiCoach {

  private static final String SYSTEM_PROMPT =
      "You are a friendly money coach for someone tracking daily spending. "
          + "Reply with ONLY a JSON object, no markdown fences, no extra text, with exactly these fields: "
          + "summary (1-2 friendly sentences about the week's spending), "
          + "weekTotal (number, total spent in the last 7 days), "
          + "topCategory (string, the biggest spending category, or null), "
          + "tips (array of exactly 3 short practical money-saving tips, specific to the numbers given), "
          + "encouragement (one warm encouraging sentence). "
          + "Be kind, never shaming, never judgmental. Use only the numbers given; never invent spending. "
          + "This is general money-habit guidance, not financial advice.";

  private final String apiKey;
  private final String model;
  private final String baseUrl;
  private final HttpClient http;
  private final ObjectMapper mapper;

  // @Autowired is required: the class also has a package-private
  // 5-arg constructor (used by unit tests), so without it Spring
  // falls back to looking for a no-arg constructor and boot fails.
  @Autowired
  public GeminiClient(
      @Value("${budgetbuddy.gemini.api-key:}") String apiKey,
      @Value("${budgetbuddy.gemini.model:gemini-3.5-flash-lite}") String model,
      @Value("${budgetbuddy.gemini.base-url:https://generativelanguage.googleapis.com/v1beta/openai/}")
          String baseUrl) {
    this(apiKey, model, baseUrl, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build(),
        new ObjectMapper());
  }

  GeminiClient(String apiKey, String model, String baseUrl, HttpClient http, ObjectMapper mapper) {
    this.apiKey = apiKey == null ? "" : apiKey.trim();
    this.model = model;
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
    this.http = http;
    this.mapper = mapper;
  }

  public boolean isConfigured() {
    return !apiKey.isBlank();
  }

  @Override
  public CoachDtos.CoachSummary coach(List<CoachDtos.ExpenseDto> expenses, double dailyBudget)
      throws Exception {
    if (!isConfigured()) {
      throw new IllegalStateException("GEMINI_API_KEY is not set");
    }
    List<CoachDtos.ExpenseDto> week = SpendingAnalyzer.weekExpenses(expenses == null ? List.of() : expenses);
    double weekTotal = SpendingAnalyzer.totalOf(week);
    StringBuilder userText = new StringBuilder();
    userText.append("Daily budget: $").append(dailyBudget).append("\n");
    userText.append("Expenses in the last 7 days (amount, category, note, date):\n");
    for (CoachDtos.ExpenseDto e : week) {
      userText.append("- ").append(e.amount()).append(", ").append(e.category()).append(", ")
          .append(e.note() == null ? "" : e.note()).append(", ").append(e.date()).append("\n");
    }
    if (week.isEmpty()) userText.append("(none yet)\n");
    String body = mapper.writeValueAsString(new ChatRequest(
        model,
        List.of(
            new ChatMessage("system", SYSTEM_PROMPT),
            new ChatMessage("user", userText.toString())),
        0.3));
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(baseUrl + "chat/completions"))
        .header("Content-Type", "application/json")
        .header("Authorization", "Bearer " + apiKey)
        .timeout(Duration.ofSeconds(30))
        .POST(HttpRequest.BodyPublishers.ofString(body))
        .build();
    HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() < 200 || response.statusCode() >= 300) {
      throw new IllegalStateException("Gemini returned HTTP " + response.statusCode());
    }
    JsonNode root = mapper.readTree(response.body());
    JsonNode content = root.path("choices").path(0).path("message").path("content");
    if (!content.isTextual()) {
      throw new IllegalStateException("Gemini returned no text content");
    }
    String json = content.asText().trim();
    if (json.startsWith("```")) {
      json = json.replaceFirst("(?s)^```(?:json)?\\s*", "").replaceFirst("(?s)\\s*```$", "");
    }
    JsonNode data = mapper.readTree(json);
    List<String> tips = new ArrayList<>();
    data.path("tips").forEach(t -> tips.add(t.asText()));
    if (tips.isEmpty()) {
      tips.add("Log every expense, even small ones — the habit matters more than the amount.");
    }
    String top = data.path("topCategory").isNull() ? null : data.path("topCategory").asText(null);
    if (top == null || top.isBlank()) top = SpendingAnalyzer.topCategoryOf(week);
    return new CoachDtos.CoachSummary(
        data.path("summary").asText("Here is a look at your week of spending."),
        data.path("weekTotal").isNumber() ? data.path("weekTotal").asDouble() : weekTotal,
        top,
        tips.subList(0, Math.min(3, tips.size())),
        data.path("encouragement").asText("Keep going — one careful day at a time."),
        "live");
  }

  private record ChatRequest(String model, List<ChatMessage> messages, double temperature) {}

  private record ChatMessage(String role, String content) {}
}
