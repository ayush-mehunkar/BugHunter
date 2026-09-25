const RULES = [
  {
    id: "SEC-001",
    name: "Security or authentication impact",
    description:
      "Detects security, authentication, authorization, credential, or unauthorized-access issues.",
    mode: "any",
    keywords: [
      "security vulnerability",
      "unauthorized access",
      "authentication failure",
      "authentication error",
      "authorization failure",
      "authorization error",
      "credential leak",
      "password exposure",
      "token exposure",
      "privilege escalation",
      "access control issue",
      "security issue",
    ],
    severity: "Critical",
    priority: "High",
    category: "Security",
  },

  {
    id: "DATA-001",
    name: "Data loss or corruption",
    description:
      "Detects confirmed or reported loss, deletion, corruption, or incorrect modification of data.",
    mode: "any",
    keywords: [
      "data loss",
      "data lost",
      "data corruption",
      "corrupted data",
      "records deleted",
      "record deleted",
      "missing data",
      "lost data",
      "incorrect data",
    ],
    severity: "Critical",
    priority: "Critical",
    category: "Data Integrity",
  },

  {
    id: "SYS-001",
    name: "Application or system unavailable",
    description:
      "Detects complete application, service, server, or system availability failures.",
    mode: "any",
    keywords: [
      "application down",
      "system down",
      "server down",
      "service down",
      "site is down",
      "application unavailable",
      "system unavailable",
      "service unavailable",
      "cannot access application",
    ],
    severity: "Blocker",
    priority: "Critical",
    category: "Availability",
  },

  {
    id: "PAY-001",
    name: "Payment or transaction failure",
    description:
      "Detects specific payment, transaction, checkout, billing, charge, or refund failure conditions.",
    mode: "any",
    keywords: [
      "payment failed",
      "payment fails",
      "payment failure",
      "payment error",
      "payment declined",
      "payment rejected",
      "payment not processed",
      "payment does not complete",
      "payment cannot complete",

      "transaction failed",
      "transaction fails",
      "transaction failure",
      "transaction error",
      "transaction declined",
      "transaction rejected",
      "transaction not processed",

      "checkout failed",
      "checkout fails",
      "checkout error",
      "checkout cannot complete",

      "billing failed",
      "billing failure",
      "billing error",

      "charge failed",
      "charge failure",
      "charge error",

      "refund failed",
      "refund failure",
      "refund error",
    ],
    severity: "Critical",
    priority: "High",
    category: "Payment",
  },

  {
    id: "PROD-001",
    name: "Production impact",
    description:
      "Detects issues explicitly reported in production or live environments.",
    mode: "any",
    keywords: [
      "production",
      "production environment",
      "live environment",
      "live system",
      "real users",
      "customer environment",
    ],
    severity: "Major",
    priority: "High",
    category: "Production",
  },

  {
    id: "USER-001",
    name: "Multiple-user impact",
    description:
      "Detects issues affecting multiple users or customers.",
    mode: "any",
    keywords: [
      "all users",
      "multiple users",
      "many users",
      "several users",
      "multiple customers",
      "many customers",
      "all customers",
      "users are affected",
      "customers are affected",
    ],
    severity: "Major",
    priority: "High",
    category: "User Impact",
  },

  {
    id: "REPRO-001",
    name: "Reproducible issue",
    description:
      "Detects explicit evidence that the bug can be reproduced consistently.",
    mode: "any",
    keywords: [
      "always happens",
      "happens every time",
      "every time",
      "consistently",
      "reproducible",
      "reproduced",
      "can reproduce",
      "reproduces",
    ],
    severity: null,
    priority: "High",
    category: "Reproducibility",
  },

  {
    id: "UI-001",
    name: "UI or cosmetic issue",
    description:
      "Detects issues primarily related to visual presentation or styling.",
    mode: "any",
    keywords: [
      "alignment issue",
      "font issue",
      "color issue",
      "spacing issue",
      "layout issue",
      "visual issue",
      "cosmetic issue",
      "ui issue",
      "display issue",
      "styling issue",
      "button color",
      "text color",
    ],
    severity: "Minor",
    priority: "Low",
    category: "UI",
  },

  {
    id: "BLOCK-001",
    name: "Critical workflow blocked",
    description:
      "Detects situations where an important workflow or feature cannot be completed.",
    mode: "any",
    keywords: [
      "cannot complete",
      "unable to complete",
      "cannot proceed",
      "unable to proceed",
      "completely blocked",
      "workflow blocked",
      "feature does not work",
      "feature not working",
    ],
    severity: "Major",
    priority: "High",
    category: "Workflow",
  },

  {
    id: "WORK-001",
    name: "Workaround available",
    description:
      "Detects explicit evidence that users can continue through an alternative method.",
    mode: "any",
    keywords: [
      "workaround available",
      "there is a workaround",
      "temporary solution",
      "alternative method",
      "alternative way",
      "can use another method",
    ],
    severity: null,
    priority: "Medium",
    category: "Workaround",
  },
];

const normalizeText = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
};

const buildBugText = (bug = {}) => {
  return [
    bug.title,
    bug.description,
    bug.environment,
    bug.stepsToReproduce,
    bug.expectedResult,
    bug.actualResult,
    Array.isArray(bug.tags)
      ? bug.tags.join(" ")
      : "",
  ]
    .filter(Boolean)
    .join(" ");
};

const containsKeyword = (text, keyword) => {
  const normalizedKeyword = normalizeText(keyword);

  if (!normalizedKeyword) {
    return false;
  }

  const escapedKeyword = normalizedKeyword.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const pattern = new RegExp(
    `(^|\\s)${escapedKeyword}(?=\\s|$|[.,!?;:])`,
    "i"
  );

  return pattern.test(text);
};

const findMatchedKeywords = (
  text,
  keywords = []
) => {
  return keywords.filter((keyword) =>
    containsKeyword(text, keyword)
  );
};

const calculateRuleScore = (
  matchedKeywords
) => {
  if (!matchedKeywords.length) {
    return 0;
  }

  return Math.min(
    100,
    60 + matchedKeywords.length * 10
  );
};

const evaluateBugRules = (bug = {}) => {
  const normalizedText = normalizeText(
    buildBugText(bug)
  );

  const triggeredRules = [];

  for (const rule of RULES) {
    const matchedKeywords =
      findMatchedKeywords(
        normalizedText,
        rule.keywords
      );

    if (!matchedKeywords.length) {
      continue;
    }

    triggeredRules.push({
      ruleId: rule.id,
      ruleName: rule.name,
      description: rule.description,
      category: rule.category,
      severityImpact: rule.severity,
      priorityImpact: rule.priority,
      matchedKeywords,
      score: calculateRuleScore(
        matchedKeywords
      ),
      explanation:
        `Rule ${rule.id} triggered because the bug contains ` +
        `the following indicators: ${matchedKeywords.join(", ")}.`,
    });
  }

  return {
    engine: "BugHunter Rule Engine",
    version: "1.2.0",
    rulesEvaluated: RULES.length,
    rulesTriggered: triggeredRules.length,
    triggeredRules,
  };
};

module.exports = {
  RULES,
  evaluateBugRules,
};
