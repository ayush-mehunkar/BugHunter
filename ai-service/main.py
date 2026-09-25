from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI(
    title="BugHunter AI Service",
    description="AI service for BugHunter bug analysis",
    version="2.0.0",
)


# ============================================================
# AI BUG ANALYSIS
# ============================================================

class BugAnalysisRequest(BaseModel):
    title: str
    description: str
    environment: str = ""
    stepsToReproduce: str = ""
    expectedResult: str = ""
    actualResult: str = ""


def analyze_bug_content(request: BugAnalysisRequest):
    text = " ".join(
        [
            request.title,
            request.description,
            request.environment,
            request.stepsToReproduce,
            request.expectedResult,
            request.actualResult,
        ]
    ).lower()

    # --------------------------------------------------------
    # Category detection
    # --------------------------------------------------------

    category = "General"

    if any(
        word in text
        for word in [
            "login",
            "logout",
            "password",
            "authentication",
            "auth",
            "sign in",
            "signin",
            "token",
            "session",
        ]
    ):
        category = "Authentication"

    elif any(
        word in text
        for word in [
            "api",
            "endpoint",
            "request",
            "response",
            "server",
            "backend",
            "500",
            "404",
            "400",
            "401",
            "403",
        ]
    ):
        category = "Backend/API"

    elif any(
        word in text
        for word in [
            "database",
            "mongodb",
            "mysql",
            "postgres",
            "query",
            "data",
            "record",
            "collection",
        ]
    ):
        category = "Database"

    elif any(
        word in text
        for word in [
            "button",
            "screen",
            "page",
            "layout",
            "css",
            "ui",
            "interface",
            "display",
            "frontend",
            "react",
        ]
    ):
        category = "UI/Frontend"

    elif any(
        word in text
        for word in [
            "slow",
            "performance",
            "timeout",
            "latency",
            "loading",
            "delay",
        ]
    ):
        category = "Performance"

    # --------------------------------------------------------
    # Severity detection
    # --------------------------------------------------------

    severity = "Minor"

    if any(
        word in text
        for word in [
            "crash",
            "data loss",
            "security breach",
            "security vulnerability",
            "blocked",
            "completely broken",
            "production down",
            "system down",
        ]
    ):
        severity = "Blocker"

    elif any(
        word in text
        for word in [
            "not working",
            "does not work",
            "cannot",
            "unable",
            "failure",
            "fails",
            "failed",
        ]
    ):
        severity = "Major"

    elif any(
        word in text
        for word in [
            "wrong",
            "incorrect",
            "error",
            "unexpected",
            "invalid",
        ]
    ):
        severity = "Critical"

    # --------------------------------------------------------
    # Priority detection
    # --------------------------------------------------------

    priority = "Low"

    if severity == "Blocker":
        priority = "Critical"

    elif severity == "Critical":
        priority = "High"

    elif severity == "Major":
        priority = "High"

    elif severity == "Minor":
        priority = "Medium"

    # --------------------------------------------------------
    # Summary
    # --------------------------------------------------------

    # Remove trailing periods before adding our own punctuation.
    clean_title = request.title.strip().rstrip(".")
    clean_description = request.description.strip().rstrip(".")
    clean_expected = request.expectedResult.strip().rstrip(".")
    clean_actual = request.actualResult.strip().rstrip(".")

    if request.title and request.actualResult and request.expectedResult:
        summary = (
            f"{clean_title}. "
            f"The actual result was: {clean_actual} "
            f"while the expected result was: {clean_expected}."
        )

    elif request.title and request.description:
        summary = (
            f"{clean_title}. "
            f"{clean_description}"
        )

    elif request.title:
        summary = clean_title

    elif request.description:
        summary = clean_description

    else:
        summary = (
            f"The reported issue is related to {category.lower()} "
            "and requires further investigation."
        )

    # --------------------------------------------------------
    # Possible cause
    # --------------------------------------------------------

    cause_details = []

    if request.actualResult and request.expectedResult:
        cause_details.append(
            "The difference between the reported actual and expected "
            "results suggests that the affected application component "
            "is not producing the expected behavior."
        )

    if request.stepsToReproduce:
        cause_details.append(
            "The provided reproduction steps should be used to identify "
            "the exact point where the behavior starts to diverge."
        )

    if request.environment:
        cause_details.append(
            f"The reported environment ({request.environment.strip()}) "
            "may also be contributing to the issue."
        )

    if category == "Authentication":
        cause_details.append(
            "Potential technical causes include authentication request "
            "handling, credentials processing, token generation or "
            "validation, session handling, or authorization logic."
        )

    elif category == "Backend/API":
        cause_details.append(
            "Potential technical causes include the API endpoint, "
            "request payload, server-side validation, authentication or "
            "authorization, backend processing, or the returned response."
        )

    elif category == "Database":
        cause_details.append(
            "Potential technical causes include the database query, "
            "connection, schema, missing records, or incorrect data handling."
        )

    elif category == "UI/Frontend":
        cause_details.append(
            "Potential technical causes include frontend state management, "
            "event handling, rendering logic, API response handling, "
            "or an incorrect UI interaction."
        )

    elif category == "Performance":
        cause_details.append(
            "Potential technical causes include inefficient database "
            "queries, excessive processing, large requests, frontend "
            "rendering overhead, or network latency."
        )

    else:
        cause_details.append(
            "Potential technical causes include incorrect application "
            "logic, unexpected input, integration problems, or an "
            "implementation defect."
        )

    possible_cause = " ".join(cause_details)

    # --------------------------------------------------------
    # Suggested fix
    # --------------------------------------------------------

    fix_steps = []

    if request.stepsToReproduce:
        fix_steps.append(
            "Reproduce the issue using the reported steps and identify "
            "the first point where the actual behavior differs from the expected behavior."
        )

    if request.expectedResult and request.actualResult:
        fix_steps.append(
            "Compare the expected and actual results to determine the "
            "specific application behavior that needs to be corrected."
        )

    if category == "Authentication":
        fix_steps.extend(
            [
                "Inspect the authentication request and response.",
                "Verify credentials, token generation, token validation, "
                "session handling, and authorization logic.",
                "Check server and browser logs for authentication errors.",
            ]
        )

    elif category == "Backend/API":
        fix_steps.extend(
            [
                "Verify the API endpoint, HTTP method, and request payload.",
                "Check backend validation, authentication, authorization, "
                "and server-side processing.",
                "Inspect the returned HTTP status and response body.",
                "Review server logs for the failure reported during reproduction.",
            ]
        )

    elif category == "Database":
        fix_steps.extend(
            [
                "Verify the database connection and query conditions.",
                "Check the schema, indexes, and expected records.",
                "Confirm that the application reads and writes the expected data.",
            ]
        )

    elif category == "UI/Frontend":
        fix_steps.extend(
            [
                "Inspect the relevant component, event handler, and state.",
                "Verify API response handling and rendering logic.",
                "Check browser console errors and network requests.",
            ]
        )

    elif category == "Performance":
        fix_steps.extend(
            [
                "Measure the slow operation and identify the bottleneck.",
                "Inspect database queries, application processing, rendering, "
                "and network latency.",
                "Optimize the component responsible for the measured delay.",
            ]
        )

    else:
        fix_steps.extend(
            [
                "Review the relevant application logic and error messages.",
                "Inspect logs and the affected component or service.",
                "Apply the smallest safe change that addresses the identified root cause.",
            ]
        )

    suggested_fix = " ".join(fix_steps)

    # --------------------------------------------------------
    # Investigation
    # --------------------------------------------------------

    investigation = []

    # Add a bug-specific investigation focus based on the report.
    investigation_focus = ""

    if request.title:
        investigation_focus = request.title.strip().rstrip(".")

    if request.description:
        investigation_focus = (
            f"{investigation_focus}. {request.description.strip().rstrip('.')}"
            if investigation_focus
            else request.description.strip().rstrip(".")
        )

    if investigation_focus:
        investigation.append(
            f"Start by focusing the investigation on the reported issue: "
            f"{investigation_focus}."
        )

    if request.stepsToReproduce:
        investigation.append(
            "Reproduce the issue using the reported steps and record "
            "the exact point where the behavior differs from expected."
        )
    else:
        investigation.append(
            "Reproduce the issue using the available bug information."
        )

    if request.expectedResult and request.actualResult:
        investigation.append(
            "Compare the expected and actual results to identify the "
            "first observable failure."
        )

    if request.environment:
        investigation.append(
            f"Verify whether the issue can be reproduced in the reported "
            f"environment: {request.environment.strip()}."
        )

    if category == "Authentication":
        investigation.extend(
            [
                "Inspect the authentication request, response, and HTTP status.",
                "Check server-side authentication logs.",
                "Verify token generation, validation, expiration, and session handling.",
                "Check frontend handling of authentication success and failure responses.",
            ]
        )

    elif category == "Backend/API":
        investigation.extend(
            [
                "Verify the API endpoint and HTTP method used by the affected workflow.",
                "Inspect the request payload and required fields.",
                "Check backend validation, authentication, authorization, and business logic.",
                "Inspect server logs for exceptions or unexpected responses.",
                "Compare the returned HTTP status and response body with the expected behavior.",
            ]
        )

    elif category == "Database":
        investigation.extend(
            [
                "Verify that the database connection is healthy.",
                "Inspect the query, filter conditions, and requested fields.",
                "Check whether the expected records exist.",
                "Verify the database schema and field names.",
                "Check for data consistency, indexing, or connection problems.",
            ]
        )

    elif category == "UI/Frontend":
        investigation.extend(
            [
                "Reproduce the issue in the affected screen or component.",
                "Inspect browser console errors and network requests.",
                "Check the relevant event handler and component state.",
                "Verify API response handling and frontend data transformation.",
                "Confirm that the UI receives and renders the expected data.",
            ]
        )

    elif category == "Performance":
        investigation.extend(
            [
                "Measure the time taken by each major step of the affected workflow.",
                "Inspect database query performance and response times.",
                "Check network requests for latency or repeated calls.",
                "Look for unnecessary processing, rendering, or repeated operations.",
                "Identify the slowest component before applying an optimization.",
            ]
        )

    else:
        investigation.extend(
            [
                "Review application logs and reported error messages.",
                "Inspect the code involved in the affected workflow.",
                "Trace the workflow from the initial input to the final result.",
                "Identify the first point where actual behavior differs from expected behavior.",
            ]
        )

    # --------------------------------------------------------
    # Root cause hypotheses
    # --------------------------------------------------------

    root_cause_hypotheses = []

    combined_text = " ".join(
        [
            request.title,
            request.description,
            request.stepsToReproduce,
            request.expectedResult,
            request.actualResult,
            request.environment,
        ]
    ).lower()

    # --------------------------------------------------------
    # Evidence-based general hypotheses
    # --------------------------------------------------------

    if request.actualResult and request.expectedResult:
        root_cause_hypotheses.append(
            "The actual result differs from the expected result, "
            "indicating that the affected workflow is not completing "
            "the intended business operation."
        )

    if request.stepsToReproduce:
        root_cause_hypotheses.append(
            "The failure is associated with the reported reproduction "
            "workflow and should be isolated to the first step where "
            "the observed behavior differs from the expected behavior."
        )

    # --------------------------------------------------------
    # Category-specific hypotheses
    # --------------------------------------------------------

    if category == "Authentication":

        if any(
            word in combined_text
            for word in [
                "login",
                "sign in",
                "signin",
                "password",
                "credential",
            ]
        ):
            root_cause_hypotheses.append(
                "The authentication flow may be rejecting valid credentials "
                "or incorrectly handling the login request."
            )

        if any(
            word in combined_text
            for word in [
                "token",
                "jwt",
                "session",
                "expired",
            ]
        ):
            root_cause_hypotheses.append(
                "Token or session handling may be incorrect, expired, "
                "missing, or not being validated as expected."
            )

        root_cause_hypotheses.append(
            "Backend authentication or authorization logic may not match "
            "the response expected by the frontend."
        )

    elif category == "Backend/API":

        if any(
            word in combined_text
            for word in [
                "400",
                "bad request",
                "invalid",
                "missing",
                "required",
                "payload",
                "field",
            ]
        ):
            root_cause_hypotheses.append(
                "The API request payload may contain a missing, invalid, "
                "or incorrectly formatted field that is rejected by "
                "backend validation."
            )

        if any(
            word in combined_text
            for word in [
                "401",
                "403",
                "unauthorized",
                "forbidden",
                "permission",
                "authentication",
                "authorization",
            ]
        ):
            root_cause_hypotheses.append(
                "Authentication or authorization rules may be preventing "
                "the API operation from being completed."
            )

        if any(
            word in combined_text
            for word in [
                "404",
                "not found",
                "endpoint",
                "route",
            ]
        ):
            root_cause_hypotheses.append(
                "The requested API endpoint or route may be incorrect, "
                "missing, or not mapped to the expected backend handler."
            )

        if any(
            word in combined_text
            for word in [
                "500",
                "internal server",
                "exception",
                "crash",
                "server error",
            ]
        ):
            root_cause_hypotheses.append(
                "A backend exception or unhandled server-side error may "
                "be occurring while processing the API request."
            )

        if any(
            word in combined_text
            for word in [
                "database",
                "mongodb",
                "mongo",
                "record",
                "save",
                "update",
                "insert",
            ]
        ):
            root_cause_hypotheses.append(
                "The API business logic may be failing while reading or "
                "writing data in the database."
            )

        root_cause_hypotheses.append(
            "The API business logic may not correctly handle the reported "
            "property verification scenario."
        )

    elif category == "Database":

        root_cause_hypotheses.extend(
            [
                "The database query or filter conditions may not match "
                "the intended records.",
                "Expected data may be missing, inconsistent, or stored "
                "under different fields.",
                "A database connection, schema, or data-mapping issue "
                "may be affecting the operation.",
            ]
        )

    elif category == "UI/Frontend":

        root_cause_hypotheses.extend(
            [
                "A frontend event handler or component state update "
                "may be incorrect.",
                "The frontend may be interpreting or transforming "
                "API data incorrectly.",
                "A rendering or conditional-display issue may be "
                "preventing the expected behavior.",
            ]
        )

    elif category == "Performance":

        root_cause_hypotheses.extend(
            [
                "A database or API operation may be taking longer "
                "than expected.",
                "The application may be performing unnecessary or "
                "repeated processing.",
                "Network latency or repeated requests may be contributing "
                "to the reported delay.",
            ]
        )

    else:

        root_cause_hypotheses.extend(
            [
                "Application logic may not correctly handle the "
                "reported scenario.",
                "Unexpected input or application state may be triggering "
                "the issue.",
                "An integration or implementation defect may be responsible.",
            ]
        )

    # Remove duplicate hypotheses while preserving order.
    root_cause_hypotheses = list(
        dict.fromkeys(root_cause_hypotheses)
    )

    # --------------------------------------------------------
    # Evidence
    # --------------------------------------------------------

    # --------------------------------------------------------

    evidence = []

    if request.title:
        evidence.append(
            f"Bug title: {request.title.strip()}"
        )

    if request.description:
        evidence.append(
            f"Reported description: {request.description.strip()}"
        )

    if request.stepsToReproduce:
        evidence.append(
            f"Reproduction steps: {request.stepsToReproduce.strip()}"
        )

    if request.expectedResult:
        evidence.append(
            f"Expected result: {request.expectedResult.strip()}"
        )

    if request.actualResult:
        evidence.append(
            f"Actual result: {request.actualResult.strip()}"
        )

    if request.environment:
        evidence.append(
            f"Reported environment: {request.environment.strip()}"
        )

    if request.expectedResult and request.actualResult:
        evidence.append(
            "Evidence indicates a difference between the expected "
            "and actual behavior reported by the user."
        )

    if not evidence:
        evidence.append(
            "Limited evidence was provided in the bug report."
        )

    # --------------------------------------------------------
    # Suggested verification tests
    # --------------------------------------------------------

    suggested_tests = []

    if request.stepsToReproduce:
        suggested_tests.append(
            "Reproduce the original bug using the reported steps "
            "and confirm the original failure condition."
        )
    else:
        suggested_tests.append(
            "Reproduce the reported issue using the available bug information."
        )

    if request.expectedResult:
        suggested_tests.append(
            f"Verify that the expected behavior occurs: "
            f"{request.expectedResult.strip()}"
        )

    if request.actualResult:
        suggested_tests.append(
            f"Verify that the reported failure no longer occurs: "
            f"{request.actualResult.strip()}"
        )

    if category == "Authentication":
        suggested_tests.extend(
            [
                "Verify successful authentication with valid credentials.",
                "Verify invalid credentials are handled correctly.",
                "Verify token or session creation and validation.",
                "Verify logout and subsequent authentication behavior.",
            ]
        )

    elif category == "Backend/API":
        suggested_tests.extend(
            [
                "Verify the endpoint with valid request data.",
                "Verify missing required fields are handled correctly.",
                "Verify invalid input and authorization handling.",
                "Verify the expected HTTP status and response structure.",
            ]
        )

    elif category == "Database":
        suggested_tests.extend(
            [
                "Verify the expected record exists and contains the correct data.",
                "Verify the query returns the intended records.",
                "Verify behavior when no matching record exists.",
                "Verify create or update operations preserve data correctly.",
            ]
        )

    elif category == "UI/Frontend":
        suggested_tests.extend(
            [
                "Verify the affected screen or component loads correctly.",
                "Verify the affected interaction with valid input.",
                "Verify invalid or boundary input handling.",
                "Verify the UI reflects the expected backend response.",
            ]
        )

    elif category == "Performance":
        suggested_tests.extend(
            [
                "Measure the affected operation under normal conditions.",
                "Measure response time with larger or repeated requests.",
                "Check for unnecessary duplicate requests or processing.",
                "Verify the optimization does not introduce functional regressions.",
            ]
        )

    else:
        suggested_tests.extend(
            [
                "Verify the expected result after the fix.",
                "Test an invalid or boundary input related to the bug.",
                "Run regression testing around the affected workflow.",
            ]
        )

    # --------------------------------------------------------
    # Risk assessment
    # --------------------------------------------------------

    if priority == "Critical":
        risk_level = "High"
        risk_reason = (
            "The issue is classified as critical and may significantly affect "
            "the application or users."
        )

    elif priority == "High":
        risk_level = "Medium-High"
        risk_reason = (
            "The issue may significantly affect an important application workflow."
        )

    elif priority == "Medium":
        risk_level = "Medium"
        risk_reason = (
            "The issue may affect a meaningful workflow but does not currently "
            "indicate a complete system failure."
        )

    else:
        risk_level = "Low"
        risk_reason = (
            "The available information suggests limited immediate impact, "
            "but regression testing is still recommended."
        )

    # --------------------------------------------------------
    # Confidence
    # --------------------------------------------------------

    confidence = 55

    if request.title:
        confidence += 5

    if request.description:
        confidence += 10

    if request.stepsToReproduce:
        confidence += 10

    if request.expectedResult:
        confidence += 5

    if request.actualResult:
        confidence += 5

    if request.expectedResult and request.actualResult:
        confidence += 5

    if request.environment:
        confidence += 5

    confidence = min(confidence, 95)

    confidence_factors = []

    if request.title:
        confidence_factors.append("bug title provided")

    if request.description:
        confidence_factors.append("bug description provided")

    if request.stepsToReproduce:
        confidence_factors.append("reproduction steps provided")

    if request.expectedResult:
        confidence_factors.append("expected result provided")

    if request.actualResult:
        confidence_factors.append("actual result provided")

    if request.expectedResult and request.actualResult:
        confidence_factors.append("expected and actual results can be compared")

    if request.environment:
        confidence_factors.append("environment information provided")

    if confidence_factors:
        confidence_reason = (
            f"Confidence is based on {', '.join(confidence_factors)}."
        )
    else:
        confidence_reason = (
            "Confidence is limited because the bug report contains "
            "very little supporting information."
        )

    # --------------------------------------------------------
    # Final structured result
    # --------------------------------------------------------

    return {
        "category": category,
        "priority": priority,
        "severity": severity,
        "summary": summary,
        "possibleCause": possible_cause,
        "suggestedFix": suggested_fix,
        "confidence": confidence,
        "confidenceReason": confidence_reason,
        "investigation": investigation,
        "rootCauseHypotheses": root_cause_hypotheses,
        "evidence": evidence,
        "suggestedTests": suggested_tests,
        "riskAssessment": {
            "level": risk_level,
            "reason": risk_reason,
        },
    }


# ============================================================
# DUPLICATE BUG DETECTION
# ============================================================

class DuplicateBug(BaseModel):
    id: str
    title: str
    description: str


class DuplicateCheckRequest(BaseModel):
    title: str
    description: str
    existingBugs: list[DuplicateBug]


def calculate_similarity(
    title1,
    description1,
    title2,
    description2,
):
    text1 = f"{title1} {description1}".lower()
    text2 = f"{title2} {description2}".lower()

    words1 = set(text1.split())
    words2 = set(text2.split())

    if not words1 or not words2:
        return 0

    common_words = words1.intersection(words2)
    total_words = words1.union(words2)

    similarity = (
        len(common_words) / len(total_words)
    ) * 100

    return round(similarity, 2)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "success": True,
        "message": "BugHunter AI Service is running",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():
    return {
        "success": True,
        "service": "BugHunter AI Service",
        "status": "healthy",
    }


# ============================================================
# BUG ANALYSIS ENDPOINT
# ============================================================

@app.post("/analyze")
def analyze_bug(request: BugAnalysisRequest):
    analysis = analyze_bug_content(request)

    return {
        "success": True,
        "message": "Bug analysis completed successfully",
        "analysis": {
            "title": request.title,
            "description": request.description,
            **analysis,
        },
    }


# ============================================================
# DUPLICATE BUG CHECK ENDPOINT
# ============================================================

@app.post("/duplicate-check")
def duplicate_check(request: DuplicateCheckRequest):
    matches = []

    for bug in request.existingBugs:
        similarity = calculate_similarity(
            request.title,
            request.description,
            bug.title,
            bug.description,
        )

        if similarity >= 30:
            matches.append(
                {
                    "bugId": bug.id,
                    "title": bug.title,
                    "description": bug.description,
                    "similarity": similarity,
                }
            )

    matches.sort(
        key=lambda item: item["similarity"],
        reverse=True,
    )

    return {
        "success": True,
        "message": "Duplicate bug check completed successfully",
        "isDuplicate": len(matches) > 0,
        "matches": matches[:5],
    }
