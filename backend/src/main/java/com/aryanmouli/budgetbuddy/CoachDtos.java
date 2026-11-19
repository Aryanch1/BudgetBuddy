package com.aryanmouli.budgetbuddy;

import java.util.List;

/** Request/response shapes for the BudgetBuddy coach service. */
public final class CoachDtos {
  private CoachDtos() {}

  public record ExpenseDto(double amount, String category, String note, String date) {}

  public record CoachRequest(List<ExpenseDto> expenses, double dailyBudget) {}

  public record CoachSummary(
      String summary,
      double weekTotal,
      String topCategory,
      List<String> tips,
      String encouragement,
      String source) {}
}
