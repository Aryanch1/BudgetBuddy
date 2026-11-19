package com.aryanmouli.budgetbuddy;

import java.util.List;

/** Produces a coach summary for a week of expenses. */
public interface AiCoach {
  CoachDtos.CoachSummary coach(List<CoachDtos.ExpenseDto> expenses, double dailyBudget)
      throws Exception;
}
