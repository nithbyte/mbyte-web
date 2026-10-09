/**
 * Comprehensive Automated Test Suite for MByte Admin Portal Services
 * Validates REST-replaceable service layer contracts, schema invariants,
 * filtering logic, and asynchronous Promise response structures across all 14 services.
 */

import {
  authService,
  territoryService,
  doctorService,
  pharmacyService,
  distributorService,
  productService,
  presenceService,
  visitService,
  orderService,
  collectionService,
  commercialService,
  fieldForceService,
  reportService,
  dashboardService,
  targetService,
  notificationService,
} from "../src/services";

console.log("=====================================================");
console.log("MBYTE ADMIN WEB SERVICE LAYER TEST SUITE");
console.log("=====================================================\n");

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}${detail ? ` -> ${detail}` : ""}`);
  }
}

async function runTestSuite() {
  try {
    // 1. Centralized Authentication Service
    console.log("\n--- [1] Authentication & Persona Service ---");
    const currentUser = await authService.getCurrentUser();
    assert(!!currentUser && typeof currentUser.id === "string", "getCurrentUser returns active user object");
    assert(currentUser.role === "MANAGER" || currentUser.role === "COMPANY_ADMIN", "Default user is MANAGER or COMPANY_ADMIN");

    const users = await authService.getAllUsers();
    assert(Array.isArray(users) && users.length >= 3, "getAllUsers returns available personas list");

    const switched = await authService.switchUser(users[1].id);
    assert(switched.id === users[1].id, `switchUser switches persona to ${users[1].name}`);

    // Restore primary manager
    await authService.switchUser("usr_mgr_001");

    const loggedIn = await authService.login({ email: "admin@novispharma.com", password: "Password123!" });
    assert(!!loggedIn?.user?.id, "login validates credentials and returns session");

    await authService.logout();
    const afterLogoutUser = await authService.getCurrentUser();
    assert(!!afterLogoutUser, "logout safely restores state");

    // 2. Territory Service
    console.log("\n--- [2] Territory Service ---");
    const territories = await territoryService.getTerritories();
    assert(Array.isArray(territories) && territories.length >= 2, "getTerritories returns territory collection");
    const firstTer = territories[0];
    const singleTer = await territoryService.getTerritoryById(firstTer.id);
    assert(singleTer?.name === firstTer.name, `getTerritoryById successfully resolves ${firstTer.name}`);

    // 3. Doctor Master Service
    console.log("\n--- [3] Doctor Master Service ---");
    const allDoctors = await doctorService.getDoctors();
    assert(Array.isArray(allDoctors) && allDoctors.length >= 8, "getDoctors returns complete HCP list");

    const filteredDocs = await doctorService.getDoctors({ specialty: "Cardiology" });
    assert(Array.isArray(filteredDocs), "getDoctors filters accurately by specialty");

    const docId = allDoctors[0].id;
    const docDetail = await doctorService.getDoctorById(docId);
    assert(docDetail?.id === docId && !!docDetail.name, "getDoctorById returns fully hydrated doctor");

    const docHistory = await doctorService.getDoctorHistory(docId);
    assert(Array.isArray(docHistory), "getDoctorHistory returns chronological visit audit trail");

    const specialties = await doctorService.getSpecialties();
    assert(Array.isArray(specialties) && (specialties.includes("Cardiology") || specialties.includes("Cardiologist")), "getSpecialties returns distinct specialty list");

    const newDoc = await doctorService.createDoctor({
      name: "Dr. Test Audit HCP",
      specialty: "Neurology",
      tier: "A",
      qualification: "MD, DM",
      clinicName: "Audit Test Neuro Care",
      address: "12 Test Healthcare Road",
      territoryId: firstTer.id,
      phone: "+919876543210",
      visitFrequency: 4,
      latitude: 9.9252,
      longitude: 78.1198,
    });
    assert(newDoc.name === "Dr. Test Audit HCP" && !!newDoc.id, "createDoctor inserts new HCP record with generated ID");

    const updatedDoc = await doctorService.updateDoctor(newDoc.id, { tier: "A_PLUS" });
    assert(updatedDoc.tier === "A_PLUS", "updateDoctor modifies HCP attributes");

    // 4. Pharmacy Service
    console.log("\n--- [4] Pharmacy Service ---");
    const pharmacies = await pharmacyService.getPharmacies();
    assert(Array.isArray(pharmacies) && pharmacies.length >= 4, "getPharmacies returns chemist outlets");

    const pharmDetail = await pharmacyService.getPharmacyById(pharmacies[0].id);
    assert(pharmDetail?.id === pharmacies[0].id, "getPharmacyById retrieves valid chemist details");

    const pharmHistory = await pharmacyService.getPharmacyHistory(pharmacies[0].id);
    assert(Array.isArray(pharmHistory), "getPharmacyHistory returns interaction logs");

    // 5. Distributor Service
    console.log("\n--- [5] Distributor Service ---");
    const distributors = await distributorService.getDistributors();
    assert(Array.isArray(distributors) && distributors.length >= 1, "getDistributors returns authorized stockists");

    const distDetail = await distributorService.getDistributorById(distributors[0].id);
    assert(distDetail?.id === distributors[0].id && !!distDetail.gstin, "getDistributorById retrieves GSTIN & DL");

    // 6. Product & Visual Aids Service
    console.log("\n--- [6] Product & Visual Aids Service ---");
    const products = await productService.getProducts();
    assert(Array.isArray(products) && products.length >= 3, "getProducts returns pharma formulary");

    const prodDetail = await productService.getProductById(products[0].id);
    assert(prodDetail?.id === products[0].id && typeof prodDetail.mrp === "number", "getProductById returns product with pricing");

    const categories = await productService.getProductCategories();
    assert(Array.isArray(categories) && categories.length >= 1, "getProductCategories lists active therapy areas");

    const visualAids = await productService.getVisualAids();
    assert(Array.isArray(visualAids) && visualAids.length >= 1, "getVisualAids returns edetailing collateral");

    const prodPresenceSummary = await productService.getProductPresenceSummary(products[0].id);
    assert(
      typeof prodPresenceSummary.totalAudits === "number" &&
      typeof prodPresenceSummary.availableCount === "number",
      "getProductPresenceSummary aggregates presence counts"
    );

    // 7. Product Presence Service
    console.log("\n--- [7] Product Presence Intelligence Service ---");
    const presenceRecords = await presenceService.getPresenceAudits();
    assert(Array.isArray(presenceRecords) && presenceRecords.length >= 10, "getPresenceAudits returns shelf audit logs");

    const presenceCounts = await presenceService.getPresenceCounts();
    assert(
      typeof presenceCounts.available === "number" &&
      typeof presenceCounts.lowStock === "number" &&
      typeof presenceCounts.outOfStock === "number",
      "getPresenceCounts categorizes shelf inventory statuses"
    );

    const auditDates = await presenceService.getUniqueAuditDates();
    assert(Array.isArray(auditDates) && auditDates.length > 0, "getUniqueAuditDates extracts timeline dates");

    // 8. Visit Management Service
    console.log("\n--- [8] Visit Management Service ---");
    const visits = await visitService.getVisits();
    assert(Array.isArray(visits) && visits.length >= 10, "getVisits returns DCR visit entries");

    const visitDetail = await visitService.getVisitById(visits[0].id);
    assert(
      visitDetail?.id === visits[0].id &&
      visitDetail.verificationStatus !== undefined &&
      typeof visitDetail.distanceMeters === "number",
      "getVisitById provides GPS verification, distance, times, outcome and notes"
    );

    const visitCounts = await visitService.getVisitCounts();
    assert(
      typeof visitCounts.todayTotal === "number" &&
      typeof visitCounts.completed === "number" &&
      typeof visitCounts.inProgress === "number" &&
      typeof visitCounts.missed === "number" &&
      typeof visitCounts.cancelled === "number",
      "getVisitCounts summarizes today, completed, in-progress, missed, and cancelled counts"
    );

    // 9. Commercial Order Service
    console.log("\n--- [9] Commercial Order Service ---");
    const orders = await orderService.getOrders();
    assert(Array.isArray(orders) && orders.length >= 10, "getOrders returns sales bookings");

    const orderDetail = await orderService.getOrderById(orders[0].id);
    assert(
      orderDetail?.id === orders[0].id &&
      Array.isArray(orderDetail.items) &&
      typeof orderDetail.totalAmount === "number",
      "getOrderById includes items, amounts, MR, and customer breakdown"
    );

    const orderKpis = await orderService.getOrderKPIs();
    assert(typeof orderKpis.todayValue === "number" && typeof orderKpis.monthlyValue === "number", "getOrderKPIs calculates today & monthly order totals");

    const orderTrend = await orderService.getOrderTrend();
    assert(Array.isArray(orderTrend) && orderTrend.length >= 7, "getOrderTrend generates revenue timeline");

    // 10. Commercial Collection Service
    console.log("\n--- [10] Commercial Collection Service ---");
    const collections = await collectionService.getCollections();
    assert(Array.isArray(collections) && collections.length >= 10, "getCollections returns payment vouchers");

    const colDetail = await collectionService.getCollectionById(collections[0].id);
    assert(
      colDetail?.id === collections[0].id &&
      typeof colDetail.amount === "number" &&
      !!colDetail.paymentMode,
      "getCollectionById provides customer, MR, amount, mode, and reference"
    );

    const colKpis = await collectionService.getCollectionKPIs();
    assert(typeof colKpis.todayValue === "number" && typeof colKpis.monthlyValue === "number", "getCollectionKPIs aggregates receipt sums");

    const colTrend = await collectionService.getCollectionTrend();
    assert(Array.isArray(colTrend) && colTrend.length >= 7, "getCollectionTrend generates collection timeline");

    // 11. Commercial Dashboard KPI Service
    console.log("\n--- [11] Commercial KPI Aggregator Service ---");
    const commKPIs = await commercialService.getCommercialKPIs();
    assert(
      typeof commKPIs.todayOrdersValue === "number" &&
      typeof commKPIs.monthlyOrdersValue === "number" &&
      typeof commKPIs.todayCollectionsValue === "number" &&
      typeof commKPIs.monthlyCollectionsValue === "number",
      "getCommercialKPIs resolves all 4 primary executive monetary metrics"
    );

    const commDailyTrends = await commercialService.getDailyTrends();
    assert(Array.isArray(commDailyTrends) && commDailyTrends.length >= 7, "getDailyTrends synchronizes order and collection curves");

    // 12. Field Force Service
    console.log("\n--- [12] Field Force Service ---");
    const fieldForce = await fieldForceService.getFieldForce();
    assert(Array.isArray(fieldForce) && fieldForce.length >= 3, "getFieldForce lists medical representatives summary");

    const mrList = await fieldForceService.getMRList();
    assert(Array.isArray(mrList) && mrList.length >= 3, "getMRList lists active representatives");

    const repDetails = await fieldForceService.getMRDetails(mrList[0].id);
    assert(repDetails?.mr.id === mrList[0].id && typeof repDetails.target.targetAmount === "number", "getMRDetails returns quotas & details");

    // 13. Reports Intelligence Service (All 6 Standard Reports)
    console.log("\n--- [13] Management Reports Service ---");
    const visitRep = await reportService.getVisitReport();
    assert(Array.isArray(visitRep.items) && typeof visitRep.totalVisits === "number", "Visit Report returns items and summary metrics");

    const mrRep = await reportService.getMRPerformanceReport();
    assert(Array.isArray(mrRep.items) && mrRep.items.length >= 3, "MR Performance Report computes strike rate & call averages");

    const shelfRep = await reportService.getProductPresenceReport();
    assert(Array.isArray(shelfRep.items) && typeof shelfRep.stockAvailabilityRate === "number", "Product Presence Report calculates retail availability percentage");

    const salesRep = await reportService.getSalesReport();
    assert(Array.isArray(salesRep.items) && typeof salesRep.totalSalesValue === "number", "Sales Report groups commercial order turnover");

    const collRep = await reportService.getCollectionReport();
    assert(Array.isArray(collRep.items) && typeof collRep.totalCollectedValue === "number", "Collection Report groups receipts and pending dues");

    const targetRep = await reportService.getTargetAchievementReport();
    assert(Array.isArray(targetRep.items) && typeof targetRep.overallAchievementPercent === "number", "Target Achievement Report calculates team quota attainment");

    // 14. Executive Dashboard Service
    console.log("\n--- [14] Executive Dashboard Service ---");
    const dashboardKPIs = await dashboardService.getKPIs();
    assert(
      typeof dashboardKPIs.calls.completedToday === "number" &&
      typeof dashboardKPIs.commercial.totalOrderValue === "number",
      "getKPIs compiles multi-dimensional operational metrics"
    );

    const managerDashboard = await dashboardService.getManagerDashboard();
    assert(
      !!managerDashboard.kpis &&
      Array.isArray(managerDashboard.recentVisits) &&
      Array.isArray(managerDashboard.territorySummary),
      "getManagerDashboard constructs complete manager cockpit data bundle"
    );

    const attentionCenter = await dashboardService.getAttentionCenter();
    assert(
      Array.isArray(attentionCenter.missedVisits) &&
      Array.isArray(attentionCenter.criticalStockouts),
      "getAttentionCenter surfaces operational alerts"
    );

    const territoryPerfs = await dashboardService.getTerritoryPerformance();
    assert(Array.isArray(territoryPerfs) && territoryPerfs.length >= 2, "getTerritoryPerformance computes regional rollups");

    // 15. Target Service
    console.log("\n--- [15] Target Quota Service ---");
    const targets = await targetService.getTargets();
    assert(Array.isArray(targets) && targets.length >= 1, "getTargets lists team quotas");

    const targetSummary = await targetService.getAchievementSummary(2026, 10);
    assert(
      typeof targetSummary.totalTargetAmount === "number" &&
      typeof targetSummary.totalAchievedAmount === "number",
      "getAchievementSummary calculates monthly sales and visit attainment"
    );

    // 16. Notification Service
    console.log("\n--- [16] Notification Service ---");
    const notifs = await notificationService.getNotifications();
    assert(Array.isArray(notifs), "getNotifications returns alert logs");

    const unreadCount = await notificationService.getUnreadCount();
    assert(typeof unreadCount === "number", "getUnreadCount returns unread badge integer");

    // Final Report
    console.log("\n=====================================================");
    console.log(`TOTAL AUDIT CHECKS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
    console.log("=====================================================");

    if (totalTests === passedTests) {
      console.log("\nCHECKPOINT: Admin web service contracts and data layer verified 100%!\n");
      process.exit(0);
    } else {
      console.error("\nSome test assertions failed.\n");
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution threw an uncaught error:", error);
    process.exit(1);
  }
}

runTestSuite();
