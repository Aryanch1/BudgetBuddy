package com.aryanmouli.budgetbuddy;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.http.HttpClient;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class CoachControllerTest {

  private CoachController controller() {
    // No API key configured, so the controller must take the demo path.
    GeminiClient gemini = new GeminiClient("", "gemini-3.5-flash-lite",
        "https://generativelanguage.googleapis.com/v1beta/openai/",
        HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build(),
        new ObjectMapper());
    return new CoachController(gemini, new SpendingAnalyzer());
  }

  private static CoachDtos.ExpenseDto exp(double amount, String category, int daysAgo) {
    return new CoachDtos.ExpenseDto(amount, category, "test", LocalDate.now().minusDays(daysAgo).toString());
  }

  @Test
  void healthReturnsOk() {
    Map<String, String> health = controller().health();
    assertEquals("ok", health.get("status"));
    assertEquals("budgetbuddy", health.get("app"));
  }

  @Test
  void coachWithoutKeyReturnsDemoSummary() {
    CoachDtos.CoachSummary s = controller().coach(
        new CoachDtos.CoachRequest(List.of(exp(12.40, "food", 0), exp(22.00, "transport", 1)), 50));
    assertEquals("demo", s.source());
    assertEquals(34.40, s.weekTotal(), 0.001);
    assertEquals(3, s.tips().size());
  }

  @Test
  void coachHandlesNullExpenses() {
    CoachDtos.CoachSummary s = controller().coach(new CoachDtos.CoachRequest(null, 50));
    assertEquals(0, s.weekTotal(), 0.001);
    assertNotNull(s.summary());
  }

  @Test
  void coachDefaultsBadBudgetToFifty() {
    CoachDtos.CoachSummary s = controller().coach(
        new CoachDtos.CoachRequest(List.of(exp(60.00, "food", 0)), 0));
    assertTrue(s.summary().contains("$50"));
  }

  @Test
  void coachWithEmptyListStillAnswers() {
    CoachDtos.CoachSummary s = controller().coach(new CoachDtos.CoachRequest(List.of(), 50));
    assertEquals("demo", s.source());
    assertTrue(s.tips().size() >= 1);
  }
}
