package com.aryanmouli.budgetbuddy;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class SpendingAnalyzerTest {

  private final SpendingAnalyzer analyzer = new SpendingAnalyzer();

  private static CoachDtos.ExpenseDto exp(double amount, String category, int daysAgo) {
    return new CoachDtos.ExpenseDto(amount, category, "test", LocalDate.now().minusDays(daysAgo).toString());
  }

  @Test
  void emptyWeekGivesDemoSummaryWithThreeTips() {
    CoachDtos.CoachSummary s = analyzer.coach(List.of(), 50);
    assertEquals(0, s.weekTotal(), 0.001);
    assertNull(s.topCategory());
    assertEquals(3, s.tips().size());
    assertEquals("demo", s.source());
    assertTrue(s.summary().contains("No spending"));
  }

  @Test
  void weekTotalAndTopCategoryAreComputed() {
    CoachDtos.CoachSummary s = analyzer.coach(
        List.of(exp(12.40, "food", 0), exp(4.50, "food", 0), exp(22.00, "transport", 1)), 50);
    assertEquals(38.90, s.weekTotal(), 0.001);
    assertEquals("transport", s.topCategory());
    assertTrue(s.summary().contains("$38.90"));
  }

  @Test
  void oldExpensesOutsideTheWeekAreIgnored() {
    CoachDtos.CoachSummary s = analyzer.coach(
        List.of(exp(100.00, "bills", 10), exp(10.00, "food", 0)), 50);
    assertEquals(10.00, s.weekTotal(), 0.001);
    assertEquals("food", s.topCategory());
  }

  @Test
  void overBudgetWeekSaysSo() {
    CoachDtos.CoachSummary s = analyzer.coach(
        List.of(exp(60.00, "food", 0), exp(60.00, "shopping", 0)), 50);
    assertTrue(s.summary().contains("over your $50 daily budget"));
    assertTrue(s.tips().stream().anyMatch(t -> t.contains("Trim about")));
  }

  @Test
  void underBudgetWeekIsEncouraging() {
    CoachDtos.CoachSummary s = analyzer.coach(List.of(exp(10.00, "food", 0)), 50);
    assertTrue(s.summary().contains("inside your $50 daily budget"));
    assertNotNull(s.encouragement());
  }

  @Test
  void biggestSpendTipNamesTheAmount() {
    CoachDtos.CoachSummary s = analyzer.coach(
        List.of(exp(45.00, "bills", 0), exp(5.00, "food", 0)), 50);
    assertTrue(s.tips().stream().anyMatch(t -> t.contains("$45.00")));
  }

  @Test
  void underBudgetDayCount() {
    List<CoachDtos.ExpenseDto> expenses = List.of(
        exp(10.00, "food", 0), exp(60.00, "food", 1), exp(5.00, "fun", 2));
    assertEquals(2, SpendingAnalyzer.countUnderBudgetDays(expenses, 50));
  }
}
