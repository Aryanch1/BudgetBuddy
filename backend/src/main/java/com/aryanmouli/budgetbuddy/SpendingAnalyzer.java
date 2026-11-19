package com.aryanmouli.budgetbuddy;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

/**
 * Rule-based coach: weekly totals, top category, three practical tips
 * and encouragement — built only from the numbers the user actually
 * logged. Used as the honest demo fallback when no Gemini key is set
 * (source "demo"), and as the safety net when the live call fails.
 */
@Service
public class SpendingAnalyzer implements AiCoach {

  static final List<String> CATEGORIES =
      List.of("food", "transport", "shopping", "fun", "bills", "health", "other");

  static final Map<String, String> LABELS = Map.of(
      "food", "Food",
      "transport", "Transport",
      "shopping", "Shopping",
      "fun", "Fun",
      "bills", "Bills",
      "health", "Health",
      "other", "Other");

  /** Expenses from the last 7 days (inclusive), newest first. */
  static List<CoachDtos.ExpenseDto> weekExpenses(List<CoachDtos.ExpenseDto> expenses) {
    LocalDate from = LocalDate.now().minusDays(6);
    return expenses.stream()
        .filter(e -> e.date() != null && !LocalDate.parse(e.date()).isBefore(from))
        .sorted((a, b) -> b.date().compareTo(a.date()))
        .toList();
  }

  static double totalOf(List<CoachDtos.ExpenseDto> expenses) {
    return expenses.stream().mapToDouble(CoachDtos.ExpenseDto::amount).sum();
  }

  static Map<String, Double> totalsByCategory(List<CoachDtos.ExpenseDto> expenses) {
    Map<String, Double> totals = new LinkedHashMap<>();
    for (String c : CATEGORIES) totals.put(c, 0.0);
    for (CoachDtos.ExpenseDto e : expenses) {
      String cat = CATEGORIES.contains(e.category()) ? e.category() : "other";
      totals.put(cat, totals.get(cat) + e.amount());
    }
    return totals;
  }

  static String topCategoryOf(List<CoachDtos.ExpenseDto> expenses) {
    if (expenses.isEmpty()) return null;
    Map<String, Double> totals = totalsByCategory(expenses);
    String best = null;
    double bestTotal = 0;
    for (Map.Entry<String, Double> entry : totals.entrySet()) {
      if (entry.getValue() > bestTotal) {
        bestTotal = entry.getValue();
        best = entry.getKey();
      }
    }
    return best;
  }

  static String money(double n) {
    return String.format("$%.2f", n);
  }

  static String money0(double n) {
    return "$" + Math.round(n);
  }

  static int countUnderBudgetDays(List<CoachDtos.ExpenseDto> expenses, double dailyBudget) {
    Map<String, Double> byDay = new LinkedHashMap<>();
    for (CoachDtos.ExpenseDto e : weekExpenses(expenses)) {
      byDay.merge(e.date(), e.amount(), Double::sum);
    }
    int count = 0;
    for (double total : byDay.values()) {
      if (total <= dailyBudget) count++;
    }
    return count;
  }

  @Override
  public CoachDtos.CoachSummary coach(List<CoachDtos.ExpenseDto> expenses, double dailyBudget) {
    List<CoachDtos.ExpenseDto> week = weekExpenses(expenses == null ? List.of() : expenses);
    double budget = dailyBudget > 0 ? dailyBudget : 50;
    double weekTotal = totalOf(week);
    String top = topCategoryOf(week);
    Map<String, Double> totals = totalsByCategory(week);
    long daysLogged = week.stream().map(CoachDtos.ExpenseDto::date).distinct().count();
    double dailyAvg = daysLogged > 0 ? weekTotal / daysLogged : 0;
    CoachDtos.ExpenseDto biggest =
        week.stream().max((a, b) -> Double.compare(a.amount(), b.amount())).orElse(null);
    int underDays = countUnderBudgetDays(week, budget);

    List<String> tips = new ArrayList<>();
    if (week.isEmpty()) {
      tips.add("Log your first expense today — even a coffee counts. One small entry a day is the whole habit.");
      tips.add("Set your daily budget in Settings so the ring on Today knows what to aim for.");
      tips.add("Try the quick-add chips: tap a category, type the amount, done in ten seconds.");
    } else {
      if (top != null) {
        tips.add(LABELS.get(top) + " is your biggest spend this week at " + money(totals.get(top))
            + ". One cheaper swap there — a home meal, a walk instead of a ride — saves real money by Friday.");
      }
      if (dailyAvg > budget) {
        tips.add("You are averaging " + money(dailyAvg) + " a day against a " + money0(budget)
            + " budget. Trim about " + money(dailyAvg - budget) + " a day and the week lands on target.");
      } else {
        tips.add("You are averaging " + money(dailyAvg) + " a day, inside your " + money0(budget)
            + " budget. Keep the streak going — small days add up to a big month.");
      }
      if (biggest != null && biggest.amount() >= budget * 0.8) {
        tips.add("Your biggest single spend was " + money(biggest.amount()) + " on "
            + LABELS.getOrDefault(biggest.category(), "Other").toLowerCase() + " ("
            + (biggest.note() == null || biggest.note().isBlank() ? "no note" : biggest.note())
            + "). Plan big spends a day ahead and they stop surprising you.");
      } else {
        tips.add("No single spend blew the budget this week. That steady pattern is exactly what a good money habit looks like.");
      }
    }

    String summary;
    if (week.isEmpty()) {
      summary = "No spending logged in the last 7 days yet. Log your first expense and the coach will have something to work with.";
    } else {
      summary = "You spent " + money(weekTotal) + " over the last 7 days across " + week.size()
          + (week.size() == 1 ? " expense" : " expenses") + ", about " + money(dailyAvg) + " a day"
          + (top != null ? ", with " + LABELS.get(top).toLowerCase() + " leading at " + money(totals.get(top)) : "")
          + ". " + (dailyAvg <= budget
              ? "That sits inside your " + money0(budget) + " daily budget — nicely done."
              : "That runs a little over your " + money0(budget) + " daily budget — a small trim gets you back on track.");
    }

    String encouragement;
    if (underDays >= 3) {
      encouragement = "You stayed under budget on " + underDays + " days this week. That is a habit worth keeping.";
    } else if (week.isEmpty()) {
      encouragement = "Every budget starts with one honest entry. You have got this.";
    } else {
      encouragement = "Progress, not perfection — one careful day at a time.";
    }

    return new CoachDtos.CoachSummary(
        summary, weekTotal, top, tips.subList(0, Math.min(3, tips.size())), encouragement, "demo");
  }
}
