package com.example.expensesplitter.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api")
public class ExpenseController {

    private List<Member> members = new ArrayList<>();
    private List<Expense> expenses = new ArrayList<>();

    // ===== MEMBERS =====
    @GetMapping("/members")
    public List<Member> getMembers() {
        return members;
    }

    @PostMapping("/members")
    public Member addMember(@RequestBody Member m) {
        members.add(m);
        return m;
    }

    // ===== EXPENSES =====
    @GetMapping("/expenses")
    public List<Expense> getExpenses() {
        return expenses;
    }

    @PostMapping("/expenses")
    public Expense addExpense(@RequestBody Expense e) {
        expenses.add(e);
        return e;
    }

    // ===== RESET =====
    @PostMapping("/reset")
    public String reset() {
        members.clear();
        expenses.clear();
        return "All data cleared!";
    }

    // ===== SUMMARY =====
    @GetMapping("/summary")
    public Map<String, Object> summary() {
        Map<String, Double> balances = new HashMap<>();
        for (Member m : members) balances.put(m.getId(), 0.0);

        for (Expense e : expenses) {
            double share = e.getAmount() / e.getParticipants().size();
            for (String p : e.getParticipants()) {
                balances.put(p, balances.get(p) - share);
            }
            balances.put(e.getPaidBy(), balances.get(e.getPaidBy()) + e.getAmount());
        }

        // Prepare balances list for frontend
        List<Map<String, Object>> memberBalances = new ArrayList<>();
        for (Member m : members) {
            Map<String, Object> mb = new HashMap<>();
            mb.put("id", m.getId());
            mb.put("name", m.getName());
            mb.put("balance", balances.get(m.getId()));
            memberBalances.add(mb);
        }

        // Calculate settlements (who pays whom)
        List<Map<String, Object>> settlements = new ArrayList<>();
        List<Map.Entry<String, Double>> creditors = new ArrayList<>();
        List<Map.Entry<String, Double>> debtors = new ArrayList<>();
        for (Map.Entry<String, Double> entry : balances.entrySet()) {
            if (entry.getValue() > 0) creditors.add(entry);
            else if (entry.getValue() < 0) debtors.add(entry);
        }

        int i = 0, j = 0;
        while (i < debtors.size() && j < creditors.size()) {
            Map.Entry<String, Double> debtor = debtors.get(i);
            Map.Entry<String, Double> creditor = creditors.get(j);

            double amount = Math.min(-debtor.getValue(), creditor.getValue());

            settlements.add(Map.of(
                "from", debtor.getKey(),
                "to", creditor.getKey(),
                "amount", amount
            ));

            debtor.setValue(debtor.getValue() + amount);
            creditor.setValue(creditor.getValue() - amount);

            if (Math.abs(debtor.getValue()) < 0.01) i++;
            if (Math.abs(creditor.getValue()) < 0.01) j++;
        }

        return Map.of(
            "balances", memberBalances,
            "settlements", settlements
        );
    }

    // ===== DTO CLASSES =====
    static class Member {
        private String id;
        private String name;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    static class Expense {
        private String desc;
        private double amount;
        private String paidBy;
        private List<String> participants;

        public String getDesc() { return desc; }
        public void setDesc(String desc) { this.desc = desc; }

        public double getAmount() { return amount; }
        public void setAmount(double amount) { this.amount = amount; }

        public String getPaidBy() { return paidBy; }
        public void setPaidBy(String paidBy) { this.paidBy = paidBy; }

        public List<String> getParticipants() { return participants; }
        public void setParticipants(List<String> participants) { this.participants = participants; }
    }
}
