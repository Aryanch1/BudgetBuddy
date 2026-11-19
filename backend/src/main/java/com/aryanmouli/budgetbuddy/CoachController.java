package com.aryanmouli.budgetbuddy;

import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Coach endpoints. POST /api/coach answers with a live Gemini summary
 * when GEMINI_API_KEY is set, and with the honest rule-based demo
 * summary otherwise — the app always says which mode answered.
 */
@RestController
public class CoachController {

  private final GeminiClient gemini;
  private final SpendingAnalyzer analyzer;

  public CoachController(GeminiClient gemini, SpendingAnalyzer analyzer) {
    this.gemini = gemini;
    this.analyzer = analyzer;
  }

  @GetMapping("/api/health")
  public Map<String, String> health() {
    return Map.of("status", "ok", "app", "budgetbuddy");
  }

  @PostMapping(value = "/api/coach", consumes = MediaType.APPLICATION_JSON_VALUE)
  public CoachDtos.CoachSummary coach(@RequestBody CoachDtos.CoachRequest request) {
    List<CoachDtos.ExpenseDto> expenses =
        request.expenses() == null ? List.of() : request.expenses();
    double budget = request.dailyBudget() > 0 ? request.dailyBudget() : 50;
    if (gemini.isConfigured()) {
      try {
        return gemini.coach(expenses, budget);
      } catch (Exception e) {
        // Live failed — fall through to the demo coach, never fail the request.
      }
    }
    return analyzer.coach(expenses, budget);
  }
}
